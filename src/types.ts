export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

export type PageId = 'home' | 'products' | 'solutions' | 'ai' | 'about' | 'blog' | 'contact' | 'legal' | 'security' | 'privacy' | 'terms' | 'ai-governance' | 'faq' | 'case-studies' | 'platform' | 'app';

export interface ProductItem {
  id: string;
  nameEn: string;
  nameAr: string;
  category: string;
  taglineEn: string;
  taglineAr: string;
  descriptionEn: string;
  descriptionAr: string;
  featuresEn: string[];
  featuresAr: string[];
  icon: string;
  badge?: string;
  statusEn?: string;
  statusAr?: string;
}

export interface SolutionItem {
  id: string;
  targetEn: string;
  targetAr: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  benefitsEn: string[];
  benefitsAr: string[];
  icon: string;
  modulesEn: string[];
  modulesAr: string[];
}

export interface AiCapability {
  id: string;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  summaryAr: string;
  detailsEn: string;
  detailsAr: string;
  icon: string;
  tagEn: string;
  tagAr: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  contentEn: string;
  contentAr: string;
  author: string;
  authorRoleEn: string;
  authorRoleAr: string;
  date: string;
  readTimeEn: string;
  readTimeAr: string;
  categoryEn: string;
  categoryAr: string;
  tags: string[];
  image: string;
}

export interface ValueItem {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
}

export interface PartnerOrg {
  name: string;
  typeEn: string;
  typeAr: string;
  logoText: string;
  regionEn: string;
  regionAr: string;
}
