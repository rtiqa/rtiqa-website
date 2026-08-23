import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import {
  LibraryResource,
  LibraryResourceType,
  LibraryStats,
  CurriculumUnit,
  Course,
  Subject,
  GradeLevel,
  ResourceActivityAction,
} from '../types';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import {
  BookOpen,
  FileText,
  Video,
  Presentation,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Search,
  Filter,
  Plus,
  Eye,
  Download,
  CheckCircle2,
  ExternalLink,
  Tag,
  Clock,
  User as UserIcon,
  Trash2,
  Edit,
  GraduationCap,
  FolderPlus,
  BookMarked,
  BarChart3,
  Globe,
  Lock,
  Compass,
} from 'lucide-react';

import { PlatformPage } from '../types';

interface DigitalLibraryPageProps {
  initialResourceId?: string;
  onNavigate?: (page: PlatformPage, detail?: { subPage?: string; id?: string }) => void;
}

export const DigitalLibraryPage: React.FC<DigitalLibraryPageProps> = ({
  initialResourceId,
  onNavigate,
}) => {
  const { user } = usePlatformAuth();

  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [units, setUnits] = useState<CurriculumUnit[]>([]);

  // Filtering & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');

  // Loading & View state
  const [isLoading, setIsLoading] = useState(true);
  const [previewResource, setPreviewResource] = useState<LibraryResource | null>(null);
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'CURRICULUM_UNITS' | 'MY_UPLOADS' | 'ANALYTICS'>('EXPLORE');

  // Add / Edit Resource Modal
  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<LibraryResourceType>('DOCUMENT');
  const [newFormat, setNewFormat] = useState('pdf');
  const [newExternalUrl, setNewExternalUrl] = useState('');
  const [newSubjectId, setNewSubjectId] = useState('');
  const [newGradeLevelId, setNewGradeLevelId] = useState('');
  const [newCourseId, setNewCourseId] = useState('');
  const [newUnitId, setNewUnitId] = useState('');
  const [newVisibility, setNewVisibility] = useState<'PUBLIC_SCHOOL' | 'COURSE_STUDENTS' | 'TEACHERS_ONLY' | 'PRIVATE'>('PUBLIC_SCHOOL');
  const [newTags, setNewTags] = useState('');
  const [isGeneratingAISummary, setIsGeneratingAISummary] = useState(false);
  const [newAiSummary, setNewAiSummary] = useState('');

  // Unit Manager Modal
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [unitCourseId, setUnitCourseId] = useState('');
  const [unitTitle, setUnitTitle] = useState('');
  const [unitDescription, setUnitDescription] = useState('');

  const canManage = user?.role === 'ORG_ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'TEACHER';

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadResources();
  }, [selectedType, selectedSubject, selectedGrade, selectedCourse, selectedUnit, searchQuery]);

  useEffect(() => {
    if (newCourseId) {
      loadUnitsForCourse(newCourseId);
    }
  }, [newCourseId]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, coursesRes, subjectsRes, gradesRes] = await Promise.all([
        platformApi.getLibraryStats(),
        platformApi.getCourses(),
        platformApi.getSubjects(),
        platformApi.getGradeLevels(),
      ]);

      if (statsRes.stats) setStats(statsRes.stats);
      if (coursesRes.data) setCourses(coursesRes.data);
      if (subjectsRes.data) setSubjects(subjectsRes.data);
      if (gradesRes.data) setGradeLevels(gradesRes.data);

      await loadResources();
    } catch (e) {
      console.error('Error loading library metadata', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnitsForCourse = async (courseId: string) => {
    try {
      const res = await platformApi.getUnitsByCourse(courseId);
      if (res.units) setUnits(res.units);
    } catch (e) {
      console.error(e);
    }
  };

  const loadResources = async () => {
    try {
      const filter: any = {};
      if (selectedType !== 'ALL') filter.resourceType = selectedType;
      if (selectedSubject !== 'ALL') filter.subjectId = selectedSubject;
      if (selectedGrade !== 'ALL') filter.gradeLevelId = selectedGrade;
      if (selectedCourse !== 'ALL') filter.courseId = selectedCourse;
      if (selectedUnit !== 'ALL') filter.unitId = selectedUnit;
      if (searchQuery.trim()) filter.search = searchQuery.trim();

      const res = await platformApi.getLibraryResources(filter);
      if (res.resources) setResources(res.resources);
    } catch (e) {
      console.error('Error loading library resources', e);
    }
  };

  const handleRecordActivity = async (resource: LibraryResource, action: ResourceActivityAction) => {
    try {
      const res = await platformApi.recordResourceActivity(resource.id, action, {
        courseId: resource.courseId,
        lessonId: resource.lessonId,
      });
      if (res.resource) {
        setResources((prev) => prev.map((r) => (r.id === res.resource.id ? res.resource : r)));
        if (previewResource?.id === res.resource.id) {
          setPreviewResource(res.resource);
        }
      }
    } catch (e) {
      console.error('Activity record error', e);
    }
  };

  useEffect(() => {
    if (initialResourceId) {
      if (resources.length > 0) {
        const found = resources.find((r) => r.id === initialResourceId);
        if (found) {
          setPreviewResource(found);
          handleRecordActivity(found, 'VIEWED');
        } else {
          platformApi.getLibraryResource(initialResourceId).then((res) => {
            if (res.resource) {
              setPreviewResource(res.resource);
              handleRecordActivity(res.resource, 'VIEWED');
            }
          }).catch(() => {});
        }
      }
    } else {
      setPreviewResource(null);
    }
  }, [initialResourceId, resources]);

  const handleOpenPreview = (res: LibraryResource) => {
    setPreviewResource(res);
    handleRecordActivity(res, 'VIEWED');
    if (onNavigate) {
      onNavigate('library', { subPage: 'resource', id: res.id });
    }
  };

  const handleClosePreview = () => {
    setPreviewResource(null);
    if (onNavigate) {
      onNavigate('library');
    }
  };

  const handleAIAssistSummary = async () => {
    if (!newTitle.trim()) {
      alert('يرجى كتابة عنوان المورد أولاً لتوليد الملخص والكلمات المفتاحية.');
      return;
    }
    setIsGeneratingAISummary(true);
    try {
      const prompt = `قم بصياغة ملخص تعليمي مركز واقتراح 4 وسوم دقيقة باللغة العربية للمورد التعليمي التالي:
العنوان: ${newTitle}
الوصف: ${newDescription || 'غير محدد'}
نوع المورد: ${newType}
الصيغة: ${newFormat}`;

      const res = await platformApi.aiTeacherAssistant({ prompt });
      if (res.success && res.data) {
        setNewAiSummary(res.data.text);
      }
    } catch (e: any) {
      alert('تعذر التوليد الذكي: ' + (e.message || 'خطأ غير معروف'));
    } finally {
      setIsGeneratingAISummary(false);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newType || !newFormat) {
      alert('يرجى ملء الحقول الإلزامية.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagArray = newTags
        .split(/[,،]+/)
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await platformApi.createLibraryResource({
        title: newTitle,
        description: newDescription || undefined,
        resourceType: newType,
        format: newFormat,
        externalUrl: newExternalUrl || undefined,
        subjectId: newSubjectId || undefined,
        gradeLevelId: newGradeLevelId || undefined,
        courseId: newCourseId || undefined,
        unitId: newUnitId || undefined,
        visibility: newVisibility,
        tags: tagArray,
        aiSummary: newAiSummary || undefined,
      });

      if (res.resource) {
        setIsAddResourceModalOpen(false);
        resetForm();
        loadResources();
        const sRes = await platformApi.getLibraryStats();
        if (sRes.stats) setStats(sRes.stats);
      }
    } catch (e: any) {
      alert('تعذر حفظ المورد: ' + (e.message || 'خطأ غير معروف'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitCourseId || !unitTitle.trim()) {
      alert('يرجى اختيار المقرر وكتابة عنوان الوحدة.');
      return;
    }

    try {
      const res = await platformApi.createUnit({
        courseId: unitCourseId,
        title: unitTitle,
        description: unitDescription || undefined,
      });

      if (res.unit) {
        setIsAddUnitModalOpen(false);
        setUnitTitle('');
        setUnitDescription('');
        if (selectedCourse === unitCourseId || newCourseId === unitCourseId) {
          loadUnitsForCourse(unitCourseId);
        }
      }
    } catch (e: any) {
      alert('تعذر إنشاء الوحدة: ' + (e.message || 'خطأ غير معروف'));
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المورد التعليمي؟')) return;
    try {
      await platformApi.deleteLibraryResource(id);
      setResources((prev) => prev.filter((r) => r.id !== id));
      if (previewResource?.id === id) setPreviewResource(null);
    } catch (e: any) {
      alert('تعذر حذف المورد: ' + (e.message || 'خطأ غير معروف'));
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewType('DOCUMENT');
    setNewFormat('pdf');
    setNewExternalUrl('');
    setNewSubjectId('');
    setNewGradeLevelId('');
    setNewCourseId('');
    setNewUnitId('');
    setNewVisibility('PUBLIC_SCHOOL');
    setNewTags('');
    setNewAiSummary('');
  };

  const getTypeIcon = (type: LibraryResourceType) => {
    switch (type) {
      case 'DOCUMENT':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'VIDEO':
        return <Video className="w-4 h-4 text-rose-400" />;
      case 'PRESENTATION':
        return <Presentation className="w-4 h-4 text-amber-400" />;
      case 'SPREADSHEET':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'INTERACTIVE':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getTypeBadgeColor = (type: LibraryResourceType) => {
    switch (type) {
      case 'DOCUMENT':
        return 'blue';
      case 'VIDEO':
        return 'rose';
      case 'PRESENTATION':
        return 'amber';
      case 'SPREADSHEET':
        return 'emerald';
      case 'INTERACTIVE':
        return 'purple';
      default:
        return 'cyan';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <BookMarked className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">المكتبة التعليمية الرقمية والمحتوى المنهجي</h1>
              <Badge variant="cyan" size="sm">Phase 5.1</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              مستودع الأصول والمقررات الرقمية التفاعلية، تنظيم الوحدات الدراسية، والتكامل مع الذكاء الاصطناعي
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <>
              <button
                onClick={() => setIsAddUnitModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-2 transition"
              >
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                <span>إضافة وحدة دراسية</span>
              </button>

              <button
                onClick={() => setIsAddResourceModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-bold text-slate-950 flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>رفع / إضافة مورد تعليمي</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Top Metrics Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي الأصول التعليمية"
            value={stats.totalResources.toString()}
            subtitle="مستندات، عروض، فيديوهات، وتطبيقات"
            icon={<BookOpen className="w-5 h-5 text-cyan-400" />}
            color="cyan"
          />
          <StatCard
            title="المشاهدات والتصفح"
            value={stats.totalViews.toString()}
            subtitle="تفاعل الطلاب والمعلمين مع الأصول"
            icon={<Eye className="w-5 h-5 text-blue-400" />}
            color="blue"
          />
          <StatCard
            title="التحميلات والاستخدام"
            value={stats.totalDownloads.toString()}
            subtitle="المذكرات والملفات المحملة للتعلم الذاتي"
            icon={<Download className="w-5 h-5 text-emerald-400" />}
            color="emerald"
          />
          <StatCard
            title="الإنجازات المكتملة"
            value={stats.totalCompletions.toString()}
            subtitle="إتمام الوحدات والتجارب التفاعلية"
            icon={<CheckCircle2 className="w-5 h-5 text-purple-400" />}
            color="purple"
          />
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('EXPLORE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'EXPLORE'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>استكشاف المكتبة والأصول ({resources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CURRICULUM_UNITS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'CURRICULUM_UNITS'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>الوحدات الدراسية والفصول</span>
        </button>

        {canManage && (
          <button
            onClick={() => setActiveTab('MY_UPLOADS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeTab === 'MY_UPLOADS'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>مواردي المرفوعة</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'ANALYTICS'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>تحليلات التعلم والمكتبة</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'EXPLORE' && (
        <div className="space-y-6">
          {/* Search & Multi-Level Filters */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، الكلمات المفتاحية، أو محتوى المورد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              {/* Resource Type Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {[
                  { id: 'ALL', label: 'الكل' },
                  { id: 'DOCUMENT', label: 'مستندات', icon: FileText },
                  { id: 'VIDEO', label: 'مرئي', icon: Video },
                  { id: 'PRESENTATION', label: 'عروض', icon: Presentation },
                  { id: 'SPREADSHEET', label: 'جداول', icon: FileSpreadsheet },
                  { id: 'INTERACTIVE', label: 'تفاعلي', icon: Sparkles },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedType(item.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                      selectedType === item.id
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {item.icon && <item.icon className="w-3.5 h-3.5" />}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Academic Dropdown Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60 text-xs">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">جميع المواد والمباحث</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">جميع المراحل والصفوف</option>
                {gradeLevels.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">جميع المقررات الدراسية</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">جميع الوحدات والفصول</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resources Cards Grid */}
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">جاري تحميل الأصول والمكتبة الرقمية...</div>
          ) : resources.length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">لا توجد موارد تعليمية مطابقة لخيارات البحث</p>
              <p className="text-xs text-slate-500">جرب تغيير معايير التصفية أو قم بإضافة موارد تعليمية جديدة.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((res) => (
                <div
                  key={res.id}
                  className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between group transition hover:shadow-xl hover:shadow-cyan-950/20"
                >
                  <div className="space-y-3">
                    {/* Card Header: Type Badge & Visibility */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={getTypeBadgeColor(res.resourceType) as any} size="sm">
                          <span className="flex items-center gap-1">
                            {getTypeIcon(res.resourceType)}
                            <span>{res.resourceType}</span>
                          </span>
                        </Badge>
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {res.format}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {res.visibility === 'PUBLIC_SCHOOL' && (
                          <span title="متاح لكافة المدرسة">
                            <Globe className="w-3.5 h-3.5 text-emerald-400" />
                          </span>
                        )}
                        {res.visibility === 'COURSE_STUDENTS' && (
                          <span title="متاح لطلاب المقرر">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                          </span>
                        )}
                        {res.visibility === 'TEACHERS_ONLY' && (
                          <span title="للمعلمين فقط">
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3
                        onClick={() => handleOpenPreview(res)}
                        className="text-sm font-bold text-white group-hover:text-cyan-400 cursor-pointer transition line-clamp-1"
                      >
                        {res.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {res.description || 'لا يوجد وصف تفصيلي لهذا الأصل التعليمي.'}
                      </p>
                    </div>

                    {/* Unit / Course Hierarchy Breadcrumb */}
                    {(res.courseTitle || res.unitTitle) && (
                      <div className="flex items-center gap-1.5 text-[11px] text-cyan-300/80 bg-cyan-950/30 p-2 rounded-xl border border-cyan-900/30">
                        <Layers className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                        <span className="truncate">{res.unitTitle || res.courseTitle}</span>
                      </div>
                    )}

                    {/* AI Summary Snippet (if available) */}
                    {res.aiSummary && (
                      <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-900/30 text-[11px] text-purple-300 flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed">{res.aiSummary}</span>
                      </div>
                    )}

                    {/* Tags */}
                    {res.tags && res.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {res.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Metrics & Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1" title="مشاهدات">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>{res.viewCount}</span>
                      </span>
                      <span className="flex items-center gap-1" title="تحميلات">
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        <span>{res.downloadCount}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenPreview(res)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold transition flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>معاينة</span>
                      </button>

                      {canManage && (
                        <button
                          onClick={() => handleDeleteResource(res.id)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="حذف المورد"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Curriculum Units View */}
      {activeTab === 'CURRICULUM_UNITS' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">هيكل الوحدات المنهجية والفصول الدراسية</h2>
              <p className="text-xs text-slate-400">تنظيم المحتوى التعليمي في وحدات مترابطة تتبع معايير المنهج الوطني</p>
            </div>
            {canManage && (
              <button
                onClick={() => setIsAddUnitModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة وحدة جديدة</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => {
              const courseUnits = units.filter((u) => u.courseId === course.id);
              const courseResources = resources.filter((r) => r.courseId === course.id);

              return (
                <div key={course.id} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{course.title}</h3>
                        <p className="text-[11px] text-slate-400">{course.subjectName || 'مقرر دراسي'}</p>
                      </div>
                    </div>
                    <Badge variant="cyan" size="sm">
                      {courseUnits.length} وحدات
                    </Badge>
                  </div>

                  {/* Units List */}
                  <div className="space-y-2">
                    {courseUnits.length === 0 ? (
                      <p className="text-xs text-slate-500 py-2">لم يتم تنظيم وحدات لهذا المقرر بعد.</p>
                    ) : (
                      courseUnits.map((u) => {
                        const unitRes = courseResources.filter((r) => r.unitId === u.id);
                        return (
                          <div
                            key={u.id}
                            className="p-3 rounded-xl bg-slate-950 border border-slate-800/60 hover:border-slate-700 flex items-center justify-between transition"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center">
                                  {u.orderIndex}
                                </span>
                                <h4 className="text-xs font-bold text-slate-200">{u.title}</h4>
                              </div>
                              {u.description && <p className="text-[11px] text-slate-400 pr-7">{u.description}</p>}
                            </div>

                            <span className="text-[11px] text-cyan-400 font-semibold px-2 py-1 rounded bg-cyan-500/10 shrink-0">
                              {unitRes.length} أصول
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'ANALYTICS' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Subject Chart / Breakdown */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>توزيع الموارد حسب المواد الدراسية</span>
              </h3>

              <div className="space-y-3">
                {stats.bySubject.map((s) => (
                  <div key={s.subjectId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{s.subjectName}</span>
                      <span className="text-cyan-400 font-bold">{s.count} موارد</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{
                          width: `${Math.min(100, (s.count / Math.max(1, stats.totalResources)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Grade Chart / Breakdown */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>توزيع الموارد حسب الصفوف والمراحل</span>
              </h3>

              <div className="space-y-3">
                {stats.byGrade.map((g) => (
                  <div key={g.gradeLevelId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{g.gradeLevelName}</span>
                      <span className="text-emerald-400 font-bold">{g.count} موارد</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        style={{
                          width: `${Math.min(100, (g.count / Math.max(1, stats.totalResources)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Preview Modal */}
      {previewResource && (
        <Modal
          isOpen={true}
          onClose={handleClosePreview}
          title={previewResource.title}
          size="lg"
        >
          <div className="space-y-5">
            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Badge variant={getTypeBadgeColor(previewResource.resourceType) as any} size="sm">
                  {previewResource.resourceType}
                </Badge>
                <span className="text-xs text-slate-400 font-medium">صيغة: {previewResource.format}</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>{previewResource.authorName || 'المعلم'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{previewResource.viewCount} مشاهدة</span>
                </span>
              </div>
            </div>

            {/* Interactive / Media Viewer Frame */}
            {previewResource.resourceType === 'VIDEO' && previewResource.externalUrl && (
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800">
                <iframe
                  src={
                    previewResource.externalUrl.includes('watch?v=')
                      ? previewResource.externalUrl.replace('watch?v=', 'embed/')
                      : previewResource.externalUrl
                  }
                  className="w-full h-full"
                  allowFullScreen
                  title={previewResource.title}
                />
              </div>
            )}

            {previewResource.resourceType === 'INTERACTIVE' && previewResource.externalUrl && (
              <div className="h-96 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                <iframe
                  src={previewResource.externalUrl}
                  className="w-full h-full"
                  title={previewResource.title}
                />
              </div>
            )}

            {/* Description & AI Summary */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-1">وصف المورد والأهداف التعليمية:</h4>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  {previewResource.description || 'لا يوجد وصف مسجل لهذا المورد.'}
                </p>
              </div>

              {previewResource.aiSummary && (
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-900/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>الملخص التعليمي الذكي (AI Augmented):</span>
                  </div>
                  <p className="text-xs text-purple-200 leading-relaxed">{previewResource.aiSummary}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => handleRecordActivity(previewResource, 'COMPLETED')}
                className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تسجيل إتمام الدراسة / النشاط</span>
              </button>

              <div className="flex items-center gap-2">
                {previewResource.externalUrl && (
                  <a
                    href={previewResource.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => handleRecordActivity(previewResource, 'DOWNLOADED')}
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-2 hover:bg-cyan-400 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>فتح الرابط المباشر / تحميل</span>
                  </a>
                )}
                <button
                  onClick={() => setPreviewResource(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Upload Resource Modal */}
      {isAddResourceModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddResourceModalOpen(false)}
          title="إضافة مورد تعليمي رقمي جديد"
          size="lg"
        >
          <form onSubmit={handleCreateResource} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-300">عنوان الأصل التعليمي *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مذكرة تدريبية في حل معادلات اللوغاريتمات"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">نوع المورد *</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as LibraryResourceType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="DOCUMENT">مستند نصي / PDF (Document)</option>
                  <option value="VIDEO">مقطع مرئي (Video / YouTube)</option>
                  <option value="PRESENTATION">عرض تقديمي (Presentation / Slides)</option>
                  <option value="SPREADSHEET">جدول بيانات (Spreadsheet / Excel)</option>
                  <option value="INTERACTIVE">تطبيق تفاعلي / محاكاة (Interactive Sim)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">الصيغة *</label>
                <input
                  type="text"
                  required
                  placeholder="pdf, youtube, mp4, pptx, xlsx, web"
                  value={newFormat}
                  onChange={(e) => setNewFormat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-300">الرابط المباشر / المصدر الخارجي</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newExternalUrl}
                  onChange={(e) => setNewExternalUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Course & Unit Association */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">المقرر الدراسي المرتبط</label>
                <select
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- اختياري: عام على مستوى المدرسة --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">الوحدة المنهجية (Chapter / Unit)</label>
                <select
                  value={newUnitId}
                  onChange={(e) => setNewUnitId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- اختياري: بدون وحدة محددة --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-300">صلاحيات الظهور والخصوصية</label>
                <select
                  value={newVisibility}
                  onChange={(e) => setNewVisibility(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="PUBLIC_SCHOOL">عام لجميع منسوبي المدرسة (طلاب ومعلمون)</option>
                  <option value="COURSE_STUDENTS">مقتصر على طلاب المقرر الدراسي المسجلين فقط</option>
                  <option value="TEACHERS_ONLY">للمعلمين والكادر الأكاديمي فقط</option>
                  <option value="PRIVATE">خاص بي فقط (مسودة عمل)</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">وصف المورد والأهداف التعليمية</label>
                  <button
                    type="button"
                    onClick={handleAIAssistSummary}
                    disabled={isGeneratingAISummary}
                    className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingAISummary ? 'جاري التوليد الذكي...' : 'توليد ملخص عبر AI'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="اكتب شرحاً للمحتوى أو اضغط على التوليد الذكي..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {newAiSummary && (
                <div className="md:col-span-2 p-3 bg-purple-950/30 border border-purple-900/40 rounded-xl text-xs text-purple-200 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-purple-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    الملخص المقترح من الذكاء الاصطناعي:
                  </span>
                  <p>{newAiSummary}</p>
                </div>
              )}

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-300">الكلمات المفتاحية (Tags - مفصولة بفواصل)</label>
                <input
                  type="text"
                  placeholder="رياضيات، لوغاريتمات، شرح، اختبارات"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddResourceModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ ونشر المورد'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Curriculum Unit Modal */}
      {isAddUnitModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddUnitModalOpen(false)}
          title="إضافة وحدة دراسية جديدة (Curriculum Unit)"
          size="md"
        >
          <form onSubmit={handleCreateUnit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">المقرر الدراسي *</label>
              <select
                required
                value={unitCourseId}
                onChange={(e) => setUnitCourseId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- اختر المقرر الدراسي --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">عنوان الوحدة أو الفصل الدراسي *</label>
              <input
                type="text"
                required
                placeholder="مثال: الوحدة الثالثة: المتجهات والهندسة الفضائية"
                value={unitTitle}
                onChange={(e) => setUnitTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">وصف الوحدة والمخرجات التعليمية</label>
              <textarea
                rows={3}
                placeholder="الأهداف والمفاهيم الأساسية التي تغطيها هذه الوحدة..."
                value={unitDescription}
                onChange={(e) => setUnitDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddUnitModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
              >
                إنشاء الوحدة الدراسية
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
