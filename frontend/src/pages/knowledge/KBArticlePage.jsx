import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Eye, EyeOff, Trash2, Clock, Building2, CheckCircle,
  FileText, Calendar, DollarSign, AlertTriangle, Lock, GraduationCap,
  ClipboardList, Mail, HelpCircle, Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/helpers';

function fmtDate(str) {
  if (!str) return '—';
  try {
    return new Date(str + 'T12:00:00').toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return str; }
}

function SectionHeader({ title, icon: Icon, accent = 'text-gray-400', badge }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${accent}`} />}
      <h3 className={`text-xs font-semibold uppercase tracking-wider ${accent}`}>{title}</h3>
      {badge && (
        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-500 uppercase tracking-wider ml-1">
          {badge}
        </span>
      )}
    </div>
  );
}

function RichContent({ html }) {
  if (!html || html === '<p></p>') return null;
  return (
    <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

function Card({ children, className = '' }) {
  return <div className={`card p-6 ${className}`}>{children}</div>;
}

export default function KBArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFounder } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get(`/kb/${id}`).then(r => { setArticle(r.data); setLoading(false); });
  }, [id]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const { data } = await api.patch(`/kb/${id}/publish`);
      setArticle(data);
      toast.success(data.status === 'published' ? 'Article published' : 'Article unpublished');
    } catch { toast.error('Failed to update status'); }
    finally { setPublishing(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/kb/${id}`);
      toast.success('Article deleted');
      navigate('/kb');
    } catch {
      toast.error('Failed to delete');
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!article) return null;

  const isDestination = article.type === 'destination';

  return (
    <div className="max-w-3xl space-y-4">
      {/* Top bar */}
      <div className="flex items-center gap-2">
        <Link to="/kb" className="btn-secondary p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="text-xs text-gray-400">Knowledge Base</span>
        {isFounder && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handlePublish}
              disabled={publishing}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                article.status === 'published'
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {article.status === 'published'
                ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</>
                : <><Eye className="w-3.5 h-3.5" /> Publish</>
              }
            </button>
            <Link to={`/kb/${id}/edit`} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Article header */}
      <Card>
        <div className="flex items-start gap-4">
          {isDestination ? (
            <span className="text-5xl leading-none shrink-0">{article.flag || '🌍'}</span>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7 text-brand-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                isDestination ? 'bg-sky-100 text-sky-700' : 'bg-brand-100 text-brand-700'
              }`}>
                {isDestination ? 'Destination Guide' : 'University'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                article.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {article.status === 'published' ? 'Published' : 'Draft'}
              </span>
              {!isDestination && article.isPartner && (
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-brand-100 text-brand-700">
                  Partner University
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{article.title}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {isDestination
                ? article.countryCode
                : `${article.city ? article.city + ' · ' : ''}${article.destinationName || ''}`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-4 pt-4 border-t border-gray-50">
          <Clock className="w-3 h-3" />
          Last updated {formatDate(article.updatedAt)}
          {article.lastUpdatedByName && ` by ${article.lastUpdatedByName}`}
        </div>
      </Card>

      {/* ════════════════════════════════
          DESTINATION content
      ════════════════════════════════ */}
      {isDestination && (
        <div className="space-y-4">

          {/* General overview */}
          {article.overview && article.overview !== '<p></p>' && (
            <Card>
              <SectionHeader title="Overview" icon={Globe} />
              <RichContent html={article.overview} />
            </Card>
          )}

          {/* Process steps */}
          {article.steps?.length > 0 && (
            <Card>
              <SectionHeader title="Process" icon={ClipboardList} />
              <div>
                {article.steps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">
                        {i + 1}
                      </div>
                      {i < article.steps.length - 1 && (
                        <div className="w-0.5 flex-1 bg-brand-100" style={{ minHeight: '1.5rem' }} />
                      )}
                    </div>
                    <div className={`flex-1 pt-1 ${i < article.steps.length - 1 ? 'pb-6' : 'pb-0'}`}>
                      <p className="font-semibold text-gray-800">{step.title}</p>
                      {step.description && (
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{step.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Key deadlines */}
          {article.deadlines?.length > 0 && (
            <Card>
              <SectionHeader title="Key Deadlines" icon={Calendar} />
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                {article.deadlines.map((dl, i) => (
                  <div
                    key={i}
                    className={`flex items-start justify-between gap-4 px-4 py-3 ${
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{dl.label}</p>
                      {dl.notes && <p className="text-xs text-gray-500 mt-0.5">{dl.notes}</p>}
                    </div>
                    <p className={`text-sm font-semibold shrink-0 ${dl.date ? 'text-brand-700' : 'text-gray-400'}`}>
                      {fmtDate(dl.date)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Required documents */}
          {article.requiredDocuments?.length > 0 && (
            <Card>
              <SectionHeader title="Required Documents" icon={FileText} />
              <div className="space-y-2">
                {article.requiredDocuments.map((doc, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs font-bold text-gray-300 w-4 shrink-0 mt-0.5 text-right">{i + 1}</span>
                    <CheckCircle className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                      {doc.notes && <p className="text-xs text-gray-500 mt-0.5">{doc.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Financial requirements */}
          {article.financialRequirements && (
            <Card>
              <SectionHeader title="Financial Requirements" icon={DollarSign} />
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {article.financialRequirements}
              </p>
            </Card>
          )}

          {/* Common mistakes */}
          {article.commonMistakes?.length > 0 && (
            <Card className="bg-red-50 border-red-100">
              <SectionHeader title="Common Mistakes to Avoid" icon={AlertTriangle} accent="text-red-500" />
              <ul className="space-y-2">
                {article.commonMistakes.map((m, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="text-red-400 font-bold shrink-0 mt-0.5">✕</span>
                    {m}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* FAQ */}
          {article.faqs?.length > 0 && (
            <Card>
              <SectionHeader title="FAQ" icon={HelpCircle} />
              <div className="space-y-4">
                {article.faqs.map((faq, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold text-gray-800 flex items-start gap-2">
                      <span className="text-brand-600 shrink-0 font-bold">Q.</span>
                      {faq.question}
                    </p>
                    <p className="text-sm text-gray-600 mt-1.5 ml-5 leading-relaxed">{faq.answer}</p>
                    {i < article.faqs.length - 1 && <div className="mt-4 h-px bg-gray-100" />}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Agent tips (internal) */}
          {article.agentTips && article.agentTips !== '<p></p>' && (
            <Card className="bg-slate-50 border-slate-200">
              <SectionHeader title="Agent Tips" icon={Lock} accent="text-slate-500" badge="Agents only" />
              <RichContent html={article.agentTips} />
            </Card>
          )}
        </div>
      )}

      {/* ════════════════════════════════
          UNIVERSITY content
      ════════════════════════════════ */}
      {!isDestination && (
        <div className="space-y-4">

          {/* Contact & details */}
          {(article.processingTime || article.contactEmail || article.contactPerson) && (
            <Card>
              <SectionHeader title="Details" icon={Building2} />
              <div className="grid grid-cols-2 gap-4 text-sm">
                {article.processingTime && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Processing Time</p>
                    <p className="font-medium text-gray-800">{article.processingTime}</p>
                  </div>
                )}
                {article.contactEmail && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Admissions Email</p>
                    <a href={`mailto:${article.contactEmail}`} className="font-medium text-brand-600 hover:underline flex items-center gap-1">
                      <Mail className="w-3 h-3 shrink-0" />{article.contactEmail}
                    </a>
                  </div>
                )}
                {article.contactPerson && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Contact Person</p>
                    <p className="font-medium text-gray-800">{article.contactPerson}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Programs */}
          {article.programs?.length > 0 && (
            <Card>
              <SectionHeader title="Programs Offered" icon={GraduationCap} />
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-xs text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-2.5 text-left font-medium">Program</th>
                      <th className="px-4 py-2.5 text-left font-medium">Language</th>
                      <th className="px-4 py-2.5 text-right font-medium">Tuition / year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {article.programs.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                        <td className="px-4 py-2.5 text-gray-500">{p.language || '—'}</td>
                        <td className="px-4 py-2.5 text-right text-gray-700">
                          {p.tuitionFee ? `€${Number(p.tuitionFee).toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Intake periods */}
          {article.intakes?.length > 0 && (
            <Card>
              <SectionHeader title="Intake Periods" icon={Calendar} />
              <div className="space-y-0 rounded-lg border border-gray-100 overflow-hidden">
                {article.intakes.map((intake, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-[1fr_auto_auto] gap-4 items-start px-4 py-3 ${
                      i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{intake.semester || '—'}</p>
                      {intake.notes && <p className="text-xs text-gray-500 mt-0.5">{intake.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-0.5">App. Deadline</p>
                      <p className="text-sm font-semibold text-brand-700">{fmtDate(intake.applicationDeadline)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-0.5">Start Date</p>
                      <p className="text-sm font-medium text-gray-600">{fmtDate(intake.startDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Application requirements */}
          {article.applicationRequirements && article.applicationRequirements !== '<p></p>' && (
            <Card>
              <SectionHeader title="Application Requirements" icon={ClipboardList} />
              <RichContent html={article.applicationRequirements} />
            </Card>
          )}

          {/* Admission profile */}
          {article.admissionProfile && article.admissionProfile !== '<p></p>' && (
            <Card>
              <SectionHeader title="Admission Profile" icon={FileText} />
              <RichContent html={article.admissionProfile} />
            </Card>
          )}

          {/* Internal notes */}
          {article.internalNotes && article.internalNotes !== '<p></p>' && (
            <Card className="bg-slate-50 border-slate-200">
              <SectionHeader title="Internal Notes" icon={Lock} accent="text-slate-500" badge="Agents only" />
              <RichContent html={article.internalNotes} />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
