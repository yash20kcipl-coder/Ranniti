import React from 'react';
import {
  Plus,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Calendar,
  Check,
  Filter,
  ArrowLeft,
  AlertCircle,
  Info,
  User,
  FileText,
  Trash2,
  Edit,
  Share2,
  Download,
  Upload,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Home,
  CheckCircle,
  HelpCircle,
  Image as ImageIcon,
  Paperclip,
  CheckSquare,
  Square,
  Shield,
  GraduationCap,
  LogOut,
  Sparkles,
  Layers,
  Settings,
  List,
  Users,
  Sun,
  Moon,
  MapPin,
  Activity,
} from 'lucide-react-native';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export const MaterialDesignIcons: React.FC<IconProps> = ({ name, size = 24, color = '#000000', style }) => {
  const iconName = name ? name.toLowerCase() : '';
  const iconProps = { size, color, style } as any;

  if (iconName.includes('plus') || iconName.includes('add')) {
    return <Plus {...iconProps} />;
  }
  if (iconName.includes('search')) {
    return <Search {...iconProps} />;
  }
  if (iconName.includes('close') || iconName.includes('cancel') || iconName.includes('x')) {
    return <X {...iconProps} />;
  }
  if (iconName.includes('chevron-down') || iconName.includes('down')) {
    return <ChevronDown {...iconProps} />;
  }
  if (iconName.includes('chevron-up') || iconName.includes('up')) {
    return <ChevronUp {...iconProps} />;
  }
  if (iconName.includes('chevron-left') || iconName.includes('back')) {
    return <ChevronLeft {...iconProps} />;
  }
  if (iconName.includes('chevron-right') || iconName.includes('arrow-right')) {
    return <ChevronRight {...iconProps} />;
  }
  if (iconName.includes('arrow-left')) {
    return <ArrowLeft {...iconProps} />;
  }
  if (iconName.includes('calendar') || iconName.includes('date')) {
    return <Calendar {...iconProps} />;
  }
  if (iconName.includes('check-circle') || iconName.includes('success')) {
    return <CheckCircle {...iconProps} />;
  }
  if (iconName.includes('check-square')) {
    return <CheckSquare {...iconProps} />;
  }
  if (iconName.includes('square')) {
    return <Square {...iconProps} />;
  }
  if (iconName.includes('check')) {
    return <Check {...iconProps} />;
  }
  if (iconName.includes('filter')) {
    return <Filter {...iconProps} />;
  }
  if (iconName.includes('alert') || iconName.includes('warning')) {
    return <AlertCircle {...iconProps} />;
  }
  if (iconName.includes('info')) {
    return <Info {...iconProps} />;
  }
  if (iconName.includes('help') || iconName.includes('question')) {
    return <HelpCircle {...iconProps} />;
  }
  if (iconName.includes('user') || iconName.includes('account') || iconName.includes('person')) {
    return <User {...iconProps} />;
  }
  if (iconName.includes('file') || iconName.includes('document')) {
    return <FileText {...iconProps} />;
  }
  if (iconName.includes('delete') || iconName.includes('trash')) {
    return <Trash2 {...iconProps} />;
  }
  if (iconName.includes('edit') || iconName.includes('pencil')) {
    return <Edit {...iconProps} />;
  }
  if (iconName.includes('share')) {
    return <Share2 {...iconProps} />;
  }
  if (iconName.includes('download')) {
    return <Download {...iconProps} />;
  }
  if (iconName.includes('upload')) {
    return <Upload {...iconProps} />;
  }
  if (iconName.includes('lock') || iconName.includes('key')) {
    return <Lock {...iconProps} />;
  }
  if (iconName.includes('mail') || iconName.includes('email')) {
    return <Mail {...iconProps} />;
  }
  if (iconName.includes('phone') || iconName.includes('call')) {
    return <Phone {...iconProps} />;
  }
  if (iconName.includes('eye-off') || iconName.includes('hide')) {
    return <EyeOff {...iconProps} />;
  }
  if (iconName.includes('eye') || iconName.includes('show')) {
    return <Eye {...iconProps} />;
  }
  if (iconName.includes('home')) {
    return <Home {...iconProps} />;
  }
  if (iconName.includes('image') || iconName.includes('photo')) {
    return <ImageIcon {...iconProps} />;
  }
  if (iconName.includes('attachment') || iconName.includes('paperclip')) {
    return <Paperclip {...iconProps} />;
  }
  if (iconName.includes('shield')) {
    return <Shield {...iconProps} />;
  }
  if (iconName.includes('school') || iconName.includes('education')) {
    return <GraduationCap {...iconProps} />;
  }
  if (iconName.includes('logout')) {
    return <LogOut {...iconProps} />;
  }
  if (iconName.includes('sparkle') || iconName.includes('star')) {
    return <Sparkles {...iconProps} />;
  }
  if (iconName.includes('layer')) {
    return <Layers {...iconProps} />;
  }
  if (iconName.includes('setting') || iconName.includes('gear')) {
    return <Settings {...iconProps} />;
  }
  if (iconName.includes('users') || iconName.includes('group') || iconName.includes('family')) {
    return <Users {...iconProps} />;
  }
  if (iconName.includes('sun') || iconName.includes('light')) {
    return <Sun {...iconProps} />;
  }
  if (iconName.includes('moon') || iconName.includes('dark')) {
    return <Moon {...iconProps} />;
  }
  if (iconName.includes('map') || iconName.includes('pin') || iconName.includes('location')) {
    return <MapPin {...iconProps} />;
  }
  if (iconName.includes('activity') || iconName.includes('stats')) {
    return <Activity {...iconProps} />;
  }
  if (iconName.includes('list')) {
    return <List {...iconProps} />;
  }

  // Default Fallback Icon
  return <Info {...iconProps} />;
};

export default MaterialDesignIcons;
