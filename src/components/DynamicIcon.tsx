import React from 'react';
import {
  Cpu,
  Building2,
  GraduationCap,
  Sparkles,
  UserCheck,
  BookOpen,
  Users,
  BarChart3,
  Code2,
  School,
  Landmark,
  HeartHandshake,
  Globe2,
  Bot,
  Compass,
  FileCode,
  Database,
  Workflow,
  BrainCircuit,
  Lightbulb,
  Brain,
  TrendingUp,
  ShieldCheck,
  Globe,
  Layers,
  Zap,
  Lock,
  Shield,
  HelpCircle,
  FileText,
  Mail,
  MapPin,
  CheckCircle2,
  Award,
  BookMarked,
  Sliders,
  Play
} from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  Cpu,
  Building2,
  GraduationCap,
  Sparkles,
  UserCheck,
  BookOpen,
  Users,
  BarChart3,
  Code2,
  School,
  Landmark,
  HeartHandshake,
  Globe2,
  Bot,
  Compass,
  FileCode,
  Database,
  Workflow,
  BrainCircuit,
  Lightbulb,
  Brain,
  TrendingUp,
  ShieldCheck,
  Globe,
  Layers,
  Zap,
  Lock,
  Shield,
  HelpCircle,
  FileText,
  Mail,
  MapPin,
  CheckCircle2,
  Award,
  BookMarked,
  Sliders,
  Play
};

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = 'w-5 h-5', size }) => {
  const IconComponent = ICON_MAP[name] || Sparkles;
  return <IconComponent className={className} size={size} />;
};

