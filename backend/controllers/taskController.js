const Task = require('../models/Task');
const User = require('../models/User');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const { buildNotification } = require('../utils/notificationUtils');

const logToStudent = async (studentId, action, user, details = '') => {
  await Student.findByIdAndUpdate(studentId, {
    $push: {
      activityLog: {
        action,
        performedBy: user._id,
        performedByName: user.name,
        details,
        createdAt: new Date(),
      },
    },
  });
};

// Fire timed notifications for tasks where the notify time has passed
const firePendingTimed = async () => {
  const now = new Date();
  const due = await Task.find({ hasTime: true, status: 'pending', notificationSent: false }).lean();
  if (!due.length) return;

  // Fetch founders once outside the loop
  const founders = await User.find({ role: 'founder', isActive: true }, '_id').lean();

  for (const task of due) {
    const fireAt = new Date(task.dueDate.getTime() - task.notifyBefore * 60 * 1000);
    if (now < fireAt) continue;

    const recipients = new Set([String(task.assignedTo)]);
    founders.forEach(f => recipients.add(String(f._id)));

    const timeStr = task.dueDate.toLocaleString('en-GB', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
    const details = [
      task.linkedStudentName ? `Student: ${task.linkedStudentName}` : '',
      task.stageName ? `Stage: ${task.stageName}` : '',
      `Scheduled: ${timeStr}`,
      task.notes || '',
    ].filter(Boolean).join(' · ');

    const notif = await buildNotification('reminder', {
      reminderTitle: task.title,
      reminderDetails: details,
    });

    if (notif) {
      await Notification.insertMany(
        [...recipients].map(uid => ({
          recipient: uid,
          type: 'custom',
          ...notif,
          student: task.linkedStudent || undefined,
          studentName: task.linkedStudentName || undefined,
          createdBy: task.createdBy,
        }))
      );
    }

    await Task.updateOne({ _id: task._id }, { $set: { notificationSent: true } });
  }
};

exports.createTask = async (req, res) => {
  const {
    title, type, priority, assignedTo,
    linkedStudent, dueDate, hasTime, notifyBefore,
    stageName, checklistItemLabel, notes,
  } = req.body;

  const assignee = await User.findById(assignedTo);
  if (!assignee || !assignee.isActive)
    return res.status(400).json({ message: 'Assigned user not found' });

  if (req.user.role === 'dc_agent' && assignee.role !== 'founder' && String(assignee._id) !== String(req.user._id))
    return res.status(403).json({ message: 'DC agents can only assign to founders or themselves' });

  let linkedStudentName;
  if (linkedStudent) {
    const student = await Student.findById(linkedStudent).select('firstName lastName');
    if (student) linkedStudentName = `${student.firstName} ${student.lastName}`;
  }

  const task = await Task.create({
    title,
    type: type || 'general',
    priority: priority || 'normal',
    assignedTo,
    assignedToName: assignee.name,
    linkedStudent: linkedStudent || undefined,
    linkedStudentName,
    dueDate: dueDate || undefined,
    hasTime: hasTime || false,
    notifyBefore: notifyBefore || 0,
    stageName: stageName || '',
    checklistItemLabel: checklistItemLabel || '',
    notes: notes || '',
    createdBy: req.user._id,
    createdByName: req.user.name,
  });

  // Notify assignee (skip self-assignment)
  if (String(assignedTo) !== String(req.user._id)) {
    const notifKey = priority === 'urgent' ? 'task_urgent' : 'task_assigned';
    const studentLink = linkedStudentName ? ` — linked to ${linkedStudentName}` : '';
    const taskNotif = await buildNotification(notifKey, {
      createdByName: req.user.name, taskTitle: title, studentLink,
    });
    if (taskNotif) {
      await Notification.create({
        recipient: assignedTo,
        student: linkedStudent || undefined,
        studentName: linkedStudentName,
        type: 'custom',
        ...taskNotif,
        createdBy: req.user._id,
      });
    }
  }

  if (linkedStudent) {
    const typeLabel = type && type !== 'general' ? ` [${type.replace(/_/g, ' ')}]` : '';
    await logToStudent(
      linkedStudent,
      `Task created: "${title}"${typeLabel}`,
      req.user,
      `Assigned to ${assignee.name}${priority === 'urgent' ? ' · Urgent' : ''}`
    );
  }

  res.status(201).json(task);
};

exports.getTasks = async (req, res) => {
  await firePendingTimed().catch(() => {});

  const filter = {};

  if (req.user.role === 'dc_agent') {
    filter.$or = [
      { assignedTo: req.user._id },
      { createdBy: req.user._id },
    ];
  }

  if (req.query.status)        filter.status        = req.query.status;
  if (req.query.assignedTo)    filter.assignedTo    = req.query.assignedTo;
  if (req.query.priority)      filter.priority      = req.query.priority;
  if (req.query.type)          filter.type          = req.query.type;
  if (req.query.linkedStudent) filter.linkedStudent = req.query.linkedStudent;
  if (req.query.hasTime === 'true')  filter.hasTime = true;
  if (req.query.hasTime === 'false') filter.hasTime = false;

  const tasks = await Task.find(filter).sort({ createdAt: -1 }).lean();
  res.json(tasks);
};

exports.getStudentTasks = async (req, res) => {
  const filter = { linkedStudent: req.params.studentId };

  if (req.user.role === 'dc_agent') {
    filter.$or = [
      { assignedTo: req.user._id },
      { createdBy: req.user._id },
    ];
  }

  const tasks = await Task.find(filter).sort({ createdAt: -1 }).lean();
  res.json(tasks);
};

exports.updateTask = async (req, res) => {
  const query = req.user.role === 'founder'
    ? { _id: req.params.id }
    : { _id: req.params.id, $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }] };

  const task = await Task.findOne(query);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const {
    title, type, priority, dueDate, hasTime, notifyBefore,
    assignedTo, linkedStudent, stageName, checklistItemLabel, notes,
  } = req.body;

  const dateOrNotifyChanged =
    String(dueDate || '') !== String(task.dueDate || '') ||
    Number(notifyBefore) !== task.notifyBefore;

  if (title    !== undefined) task.title    = title;
  if (type     !== undefined) task.type     = type;
  if (priority !== undefined) task.priority = priority;
  if (dueDate  !== undefined) task.dueDate  = dueDate || undefined;
  if (hasTime  !== undefined) task.hasTime  = hasTime;
  if (notifyBefore !== undefined) task.notifyBefore = notifyBefore;
  if (stageName !== undefined) task.stageName = stageName;
  if (checklistItemLabel !== undefined) task.checklistItemLabel = checklistItemLabel;
  if (notes !== undefined) task.notes = notes;

  if (assignedTo !== undefined && String(assignedTo) !== String(task.assignedTo)) {
    const assignee = await User.findById(assignedTo);
    if (!assignee || !assignee.isActive)
      return res.status(400).json({ message: 'Assigned user not found' });
    task.assignedTo = assignedTo;
    task.assignedToName = assignee.name;
  }

  if (linkedStudent !== undefined) {
    task.linkedStudent = linkedStudent || undefined;
    if (linkedStudent) {
      const student = await Student.findById(linkedStudent).select('firstName lastName');
      if (student) task.linkedStudentName = `${student.firstName} ${student.lastName}`;
    } else {
      task.linkedStudentName = undefined;
    }
  }

  // Reset notification if scheduling changed
  if (dateOrNotifyChanged && task.hasTime) task.notificationSent = false;

  await task.save();
  res.json(task);
};

exports.updateStatus = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  if (req.user.role === 'dc_agent') {
    const isAssignee = String(task.assignedTo) === String(req.user._id);
    const isCreator  = String(task.createdBy)  === String(req.user._id);
    if (!isAssignee && !isCreator)
      return res.status(403).json({ message: 'Not authorized' });
  }

  const { status, completionNote } = req.body;
  const markingDone = status === 'done';

  task.status = status;
  task.completedAt   = markingDone ? new Date() : undefined;
  task.completionNote = markingDone ? (completionNote || '') : '';
  await task.save();

  if (markingDone && String(task.createdBy) !== String(req.user._id)) {
    const doneNotif = await buildNotification('task_completed', {
      userName: req.user.name,
      taskTitle: task.title,
      completionNote: completionNote ? `: "${completionNote}"` : '',
    });
    if (doneNotif) {
      await Notification.create({
        recipient: task.createdBy,
        type: 'custom',
        ...doneNotif,
        createdBy: req.user._id,
      });
    }
  }

  if (task.linkedStudent) {
    const action  = markingDone ? `Task completed: "${task.title}"` : `Task reopened: "${task.title}"`;
    const details = markingDone && completionNote ? `Note: ${completionNote}` : '';
    await logToStudent(task.linkedStudent, action, req.user, details);
  }

  res.json(task);
};

exports.toggleDone = async (req, res) => {
  const query = req.user.role === 'founder'
    ? { _id: req.params.id }
    : { _id: req.params.id, $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }] };

  const task = await Task.findOne(query);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  task.status     = task.status === 'done' ? 'pending' : 'done';
  task.completedAt = task.status === 'done' ? new Date() : undefined;
  await task.save();
  res.json(task);
};

exports.deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const isCreator = String(task.createdBy) === String(req.user._id);
  if (req.user.role !== 'founder' && !isCreator)
    return res.status(403).json({ message: 'Not authorized' });

  await task.deleteOne();
  res.json({ message: 'Task deleted' });
};

exports.checkOverdue = async (req, res) => {
  const now = new Date();
  const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000);

  const filter = {
    status: 'pending',
    dueDate: { $lt: now },
    $or: [
      { lastOverdueNotification: { $exists: false } },
      { lastOverdueNotification: { $lt: twentyHoursAgo } },
    ],
  };
  if (req.user.role === 'dc_agent') filter.assignedTo = req.user._id;

  const overdue = await Task.find(filter);
  for (const task of overdue) {
    const overdueNotif = await buildNotification('task_overdue', { taskTitle: task.title });
    if (overdueNotif) {
      await Notification.create({
        recipient: task.assignedTo,
        type: 'custom',
        ...overdueNotif,
        createdBy: task.createdBy,
      });
    }
    task.lastOverdueNotification = new Date();
    await task.save();
  }

  res.json({ flagged: overdue.length });
};
