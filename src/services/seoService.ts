import { PageId, Language } from '../types';

export interface PageMetadata {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export const ROUTE_METADATA: Record<string, PageMetadata> = {
  home: {
    titleEn: 'Rtiqa (رتقاء) | AI Operating System for Education',
    titleAr: 'رتقاء (Rtiqa) | نظام التشغيل بالذكاء الاصطناعي للتعليم',
    descriptionEn: 'Rtiqa (رتقاء) is a technology company building the AI Operating System for Education and enterprise digital software infrastructure.',
    descriptionAr: 'رتقاء منصة رقمية وتقنية رائدة تبني نظام التشغيل بالذكاء الاصطناعي للتعليم والبنية التحتية البرمجية الذكية للمؤسسات.',
  },
  products: {
    titleEn: 'Products & Ecosystem | Rtiqa (رتقاء)',
    titleAr: 'منظومة المنتجات والحلول | رتقاء (Rtiqa)',
    descriptionEn: 'Explore Rtiqa intelligent product suite: Core OS, School ERP, Next-Gen LMS, Sovereign AI Engine, Analytics, and Rtiqa Connect.',
    descriptionAr: 'استكشف منتجات رتقاء الذكية: النظام الأساسي، إدارة المدارس، منصة التعلم LMS، محرك الذكاء الاصطناعي السيادي، والتحليلات.',
  },
  solutions: {
    titleEn: 'Tailored Educational Solutions | Rtiqa (رتقاء)',
    titleAr: 'الحلول المخصصة للمؤسسات والتعليم | رتقاء (Rtiqa)',
    descriptionEn: 'Tailored digital transformation and AI infrastructure solutions for K-12 schools, universities, ministries, and corporate academies.',
    descriptionAr: 'حلول التحول الرقمي والبنية التحتية الذكية المخصصة للمدارس، الجامعات، الوزارات والهيئات التعليمية.',
  },
  ai: {
    titleEn: 'Sovereign AI Engine | Rtiqa (رتقاء)',
    titleAr: 'محرك الذكاء الاصطناعي السيادي | رتقاء (Rtiqa)',
    descriptionEn: 'Discover Rtiqa Sovereign AI Engine for education, prioritizing pedagogical guardrails, data privacy, and adaptive learning.',
    descriptionAr: 'تعرّف على محرك الذكاء الاصطناعي السيادي من رتقاء المخصص للتربية والتعليم مع أعلى معايير الأمان والأتمتة.',
  },
  about: {
    titleEn: 'About Us & Global Vision | Rtiqa (رتقاء)',
    titleAr: 'عن الشركة والرؤية العالمية | رتقاء (Rtiqa)',
    descriptionEn: 'Learn about Rtiqa mission, leadership vision, and commitment to shaping the future of global educational technology.',
    descriptionAr: 'تعرّف على رؤية رتقاء، رسالتنا، وفريق العمل الملتزم بتطوير مستقبل التكنولوجيا التعليمية العالمية.',
  },
  blog: {
    titleEn: 'Insights & Research | Rtiqa (رتقاء)',
    titleAr: 'الأبحاث والأفكار الرقمية | رتقاء (Rtiqa)',
    descriptionEn: 'Read research, insights, and technical articles on AI in education, data sovereignty, and digital learning infrastructure.',
    descriptionAr: 'اقرأ أحدث مقالاتنا وأبحاثنا الرائدة حول الذكاء الاصطناعي في التعليم والسيادة الرقمية وتكنولوجيا التعلم.',
  },
  contact: {
    titleEn: 'Contact Enterprise Team | Rtiqa (رتقاء)',
    titleAr: 'تواصل مع فريق المؤسسات | رتقاء (Rtiqa)',
    descriptionEn: 'Get in touch with Rtiqa enterprise team to request a demo, discuss institutional partnerships, or explore deployment options.',
    descriptionAr: 'تواصل مع فريق رتقاء للمؤسسات لطلب عرض توضيحي، وبحث الشراكات التعليمية، واستكشاف خيارات التشغيل.',
  },
  legal: {
    titleEn: 'Legal Policies & Governance | Rtiqa (رتقاء)',
    titleAr: 'الأمان والسيادة والحوكمة | رتقاء (Rtiqa)',
    descriptionEn: 'Review Rtiqa legal governance, security framework, student data privacy standards, and enterprise terms of service.',
    descriptionAr: 'استعرض أطر الحوكمة والقوانين، معايير الأمن السيبراني، وخصوصية بيانات الطلاب في منظومة رتقاء.',
  },
  security: {
    titleEn: 'Security Principles & Architecture | Rtiqa (رتقاء)',
    titleAr: 'مبادئ الأمن والسيادة الرقمية | رتقاء (Rtiqa)',
    descriptionEn: 'Explore Rtiqa security principles, zero-trust architecture blueprints, and data protection guidelines.',
    descriptionAr: 'استعرض مبادئ الأمان والسيادة الرقمية وبنية الحماية الخالية من الثغرات في منظومة رتقاء.',
  },
  privacy: {
    titleEn: 'Privacy Policy & Student Data Protection | Rtiqa (رتقاء)',
    titleAr: 'سياسة الخصوصية وحماية البيانات | رتقاء (Rtiqa)',
    descriptionEn: 'Learn how Rtiqa protects student data privacy and upholds global compliance standards.',
    descriptionAr: 'تعرّف على كيفية حماية رتقاء لخصوصية بيانات الطلاب والالتزام بأعلى المعايير العالمية.',
  },
  terms: {
    titleEn: 'Terms of Service & Enterprise Agreement | Rtiqa (رتقاء)',
    titleAr: 'شروط الخدمة والاتفاقية المؤسسية | رتقاء (Rtiqa)',
    descriptionEn: 'Review the terms of service and enterprise agreement for using Rtiqa software and platforms.',
    descriptionAr: 'شروط الاستخدام والاتفاقات المؤسسية الخاصة باستخدام منصات وبرمجيات رتقاء.',
  },
  'ai-governance': {
    titleEn: 'Responsible AI Governance & Ethics | Rtiqa (رتقاء)',
    titleAr: 'حوكمة الذكاء الاصطناعي والتربية | رتقاء (Rtiqa)',
    descriptionEn: 'Our ethical AI governance framework ensuring safe, unbiased, and pedagogically sound artificial intelligence in education.',
    descriptionAr: 'إطار حوكمة الذكاء الاصطناعي الأخلاقي وضوابط الاستخدام الآمن والمسؤول في المنظومة التعليمية.',
  },
  faq: {
    titleEn: 'Frequently Asked Questions & Knowledge Base | Rtiqa (رتقاء)',
    titleAr: 'الأسئلة الشائعة والمعرفية | رتقاء (Rtiqa)',
    descriptionEn: 'Find answers to frequently asked questions about Rtiqa education AI operating system, deployment, and security.',
    descriptionAr: 'إجابات الأسئلة الشائعة حول نظام رتقاء للذكاء الاصطناعي في التعليم، خيارات النشر، ومعايير الأمان.',
  },
  'case-studies': {
    titleEn: 'Case Studies & Institutional Pilot Research | Rtiqa (رتقاء)',
    titleAr: 'قصص النجاح ودراسات الحالة | رتقاء (Rtiqa)',
    descriptionEn: 'Explore institutional case studies, pilot research, and deployment frameworks for Rtiqa education technology.',
    descriptionAr: 'استعرض دراسات الحالة وأبحاث التجارب الميدانية لتطبيقات رتقاء في المنظومات التعليمية.',
  },
  notFound: {
    titleEn: '404 - Page Not Found | Rtiqa (رتقاء)',
    titleAr: '404 - الصفحة غير موجودة | رتقاء (Rtiqa)',
    descriptionEn: 'The requested page could not be found. Return to Rtiqa home page or explore our solutions.',
    descriptionAr: 'الصفحة المطلوبة غير موجودة. عد إلى الصفحة الرئيسية لرتقاء أو استكشف حلولنا.',
  },
};

function updateMetaTag(nameOrProperty: string, value: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let element = document.querySelector(`meta[${attr}="${nameOrProperty}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, nameOrProperty);
    document.head.appendChild(element);
  }
  element.setAttribute('content', value);
}

function updateCanonicalUrl(url: string) {
  let element = document.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', url);
}

export function updateSeoMetadata(pageKey: string, language: Language, detailId?: string) {
  const meta = ROUTE_METADATA[pageKey] || ROUTE_METADATA.home;
  const isAr = language === 'ar';
  
  const title = isAr ? meta.titleAr : meta.titleEn;
  const description = isAr ? meta.descriptionAr : meta.descriptionEn;

  // 1. Document Title
  document.title = title;

  // 2. Meta Description & Keywords
  updateMetaTag('description', description);
  updateMetaTag('keywords', 'Rtiqa, رتقاء, EdTech, AI Education, AI Operating System, Sovereign AI, LMS, School ERP, Pedagogical AI');

  // 3. Open Graph Tags
  updateMetaTag('og:title', title, true);
  updateMetaTag('og:description', description, true);
  updateMetaTag('og:type', 'website', true);
  updateMetaTag('og:site_name', 'Rtiqa (رتقاء)', true);

  // 4. Twitter Card
  updateMetaTag('twitter:card', 'summary_large_image');
  updateMetaTag('twitter:title', title);
  updateMetaTag('twitter:description', description);

  // 5. Canonical URL
  const baseUrl = window.location.origin + window.location.pathname;
  const hash = pageKey === 'home' && !detailId ? '' : `#${pageKey}${detailId ? '/' + detailId : ''}`;
  const canonicalUrl = `${baseUrl}${hash}`;
  updateMetaTag('og:url', canonicalUrl, true);
  updateCanonicalUrl(canonicalUrl);
}
