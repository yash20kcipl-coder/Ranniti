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
  Camera,
  Building,
  Building2,
  Briefcase,
  Church,
  Landmark,
  CreditCard,
  IdCard,
  Crosshair,
  Target,
  Flag,
  Crown,
  Star,
  Droplet,
  Hash,
  ListOrdered,
  Languages,
  Signpost,
  Unlink,
  Vote,
  Venus,
  Mars,
  Transgender,
  VenusAndMars,
  Skull,
  Heart,
  MessageSquare,
  RefreshCw,
  UserStar,
  UserCheck,
  Handshake,
} from 'lucide-react-native';
import { Image } from 'react-native';
import whatsappIcon from '../assets/images/icons/whatsapp.png';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export const MaterialDesignIcons: React.FC<IconProps> = ({ name, size = 24, color = '#000000', style }) => {
  const iconName = name ? name.toLowerCase() : '';
  const iconProps = { size, color, style } as any;

  // Camera
  if (iconName.includes('camera')) {
    return <Camera {...iconProps} />;
  }

  // Add / Plus
  if (iconName.includes('plus') || iconName.includes('add')) {
    return <Plus {...iconProps} />;
  }

  // Search
  if (iconName.includes('search') || iconName.includes('magnify') || iconName.includes('find')) {
    return <Search {...iconProps} />;
  }

  // Close / Cancel / Cross
  if (iconName.includes('close') || iconName.includes('cancel') || iconName === 'x') {
    return <X {...iconProps} />;
  }

  // Chevrons & Arrows
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

  // Refresh / Reload / Sync
  if (iconName.includes('refresh') || iconName.includes('reload') || iconName.includes('sync')) {
    return <RefreshCw {...iconProps} />;
  }

  // Calendar / Date
  if (iconName.includes('calendar') || iconName.includes('date')) {
    return <Calendar {...iconProps} />;
  }

  // Checks & Squares
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

  // Filters
  if (iconName.includes('filter')) {
    return <Filter {...iconProps} />;
  }

  // Alerts & Info
  if (iconName.includes('alert') || iconName.includes('warning')) {
    return <AlertCircle {...iconProps} />;
  }
  if (iconName.includes('info')) {
    return <Info {...iconProps} />;
  }
  if (iconName.includes('help') || iconName.includes('question')) {
    return <HelpCircle {...iconProps} />;
  }

  // Gender icons
  if (iconName.includes('female') || iconName.includes('venus')) {
    return <Venus {...iconProps} />;
  }
  if (iconName.includes('male') || iconName.includes('mars')) {
    return <Mars {...iconProps} />;
  }
  if (iconName.includes('transgender')) {
    return <Transgender {...iconProps} />;
  }
  if (iconName.includes('gender')) {
    return <VenusAndMars {...iconProps} />;
  }

  // Badges & ID Cards (must precede user / account checks)
  if (
    iconName.includes('id-card') ||
    iconName.includes('badge') ||
    iconName.includes('card-account') ||
    iconName.includes('account-card') ||
    iconName.includes('card-text') ||
    iconName.includes('card-bulleted') ||
    iconName.includes('identification')
  ) {
    return <IdCard {...iconProps} />;
  }

  // Credit Card / General Cards (Aadhaar, PAN)
  if (
    iconName.includes('credit-card') ||
    iconName.includes('card') ||
    iconName.includes('pan') ||
    iconName.includes('aadhaar')
  ) {
    return <CreditCard {...iconProps} />;
  }

  // Specific user roles (must precede general user checks)
  if (
    iconName.includes('user-star') ||
    iconName.includes('account-star') ||
    iconName.includes('star-circle')
  ) {
    return <UserStar {...iconProps} />;
  }
  if (iconName.includes('user-check') || iconName.includes('account-check')) {
    return <UserCheck {...iconProps} />;
  }

  // Users & Groups
  if (
    iconName.includes('users') ||
    iconName.includes('group') ||
    iconName.includes('family') ||
    iconName.includes('account-group')
  ) {
    return <Users {...iconProps} />;
  }
  if (iconName.includes('user') || iconName.includes('account') || iconName.includes('person')) {
    return <User {...iconProps} />;
  }

  // Files & Documents
  if (iconName.includes('file') || iconName.includes('document')) {
    return <FileText {...iconProps} />;
  }

  // Editing & Deletion
  if (iconName.includes('delete') || iconName.includes('trash')) {
    return <Trash2 {...iconProps} />;
  }
  if (iconName.includes('edit') || iconName.includes('pencil')) {
    return <Edit {...iconProps} />;
  }

  // Sharing & Upload/Download
  if (iconName.includes('share')) {
    return <Share2 {...iconProps} />;
  }
  if (iconName.includes('download')) {
    return <Download {...iconProps} />;
  }
  if (iconName.includes('upload')) {
    return <Upload {...iconProps} />;
  }

  // Security & Authentication
  if (iconName.includes('lock') || iconName.includes('key')) {
    return <Lock {...iconProps} />;
  }
  if (iconName.includes('shield')) {
    return <Shield {...iconProps} />;
  }

  // Contact: Mail & Phone & Messages
  if (iconName.includes('mail') || iconName.includes('email')) {
    return <Mail {...iconProps} />;
  }
  if (iconName.includes('phone') || iconName.includes('call')) {
    return <Phone {...iconProps} />;
  }
  if (iconName.includes('message') || iconName.includes('chat') || iconName.includes('sms')) {
    return <MessageSquare {...iconProps} />;
  }

  // Visibility
  if (iconName.includes('eye-off') || iconName.includes('hide')) {
    return <EyeOff {...iconProps} />;
  }
  if (iconName.includes('eye') || iconName.includes('show')) {
    return <Eye {...iconProps} />;
  }

  // Buildings, Cities, Offices, Booths
  if (
    iconName.includes('building') ||
    iconName.includes('city') ||
    iconName.includes('office') ||
    iconName.includes('booth') ||
    iconName.includes('town')
  ) {
    return <Building2 {...iconProps} />;
  }

  // Religious & Cultural Landmarks
  if (iconName.includes('church')) {
    return <Church {...iconProps} />;
  }
  if (
    iconName.includes('landmark') ||
    iconName.includes('temple') ||
    iconName.includes('religion')
  ) {
    return <Landmark {...iconProps} />;
  }

  // Work & Professions
  if (
    iconName.includes('briefcase') ||
    iconName.includes('work') ||
    iconName.includes('profession') ||
    iconName.includes('occupation') ||
    iconName.includes('job')
  ) {
    return <Briefcase {...iconProps} />;
  }

  // Flag & Political Parties
  if (iconName.includes('flag')) {
    return <Flag {...iconProps} />;
  }

  // Vote & Electoral
  if (iconName.includes('vote')) {
    return <Vote {...iconProps} />;
  }
  if (iconName.includes('handshake')) {
    return <Handshake {...iconProps} />;
  }

  // Crown & Honors
  if (iconName.includes('crown')) {
    return <Crown {...iconProps} />;
  }

  // Droplet & Blood Group
  if (iconName.includes('water') || iconName.includes('blood') || iconName.includes('droplet')) {
    return <Droplet {...iconProps} />;
  }

  // GPS, Crosshair, Target
  if (iconName.includes('target') || iconName.includes('bullseye')) {
    return <Target {...iconProps} />;
  }
  if (
    iconName.includes('gps') ||
    iconName.includes('crosshair') ||
    iconName.includes('crosshairs')
  ) {
    return <Crosshair {...iconProps} />;
  }

  // Signpost, Directions
  if (iconName.includes('sign') || iconName.includes('direction') || iconName.includes('signpost')) {
    return <Signpost {...iconProps} />;
  }

  // Unlink / Link-off
  if (iconName.includes('unlink') || iconName.includes('link-off')) {
    return <Unlink {...iconProps} />;
  }

  // Numbers & Ordering
  if (
    iconName.includes('list-numbered') ||
    iconName.includes('list-ordered') ||
    iconName.includes('numbered') ||
    iconName.includes('format-list-numbered')
  ) {
    return <ListOrdered {...iconProps} />;
  }
  if (iconName.includes('list')) {
    return <List {...iconProps} />;
  }
  if (iconName.includes('numeric') || iconName.includes('hash') || iconName.includes('number')) {
    return <Hash {...iconProps} />;
  }

  // Skull / Deceased
  if (iconName.includes('skull') || iconName.includes('dead') || iconName.includes('deceased')) {
    return <Skull {...iconProps} />;
  }

  // Heart / Pulse
  if (iconName.includes('heart')) {
    return <Heart {...iconProps} />;
  }

  // Languages / Translate
  if (iconName.includes('translate') || iconName.includes('language')) {
    return <Languages {...iconProps} />;
  }

  // Home & Locations
  if (iconName.includes('home')) {
    return <Home {...iconProps} />;
  }
  if (iconName.includes('map') || iconName.includes('pin') || iconName.includes('location')) {
    return <MapPin {...iconProps} />;
  }

  // Image & Attachments
  if (iconName.includes('image') || iconName.includes('photo')) {
    return <ImageIcon {...iconProps} />;
  }
  if (iconName.includes('attachment') || iconName.includes('paperclip')) {
    return <Paperclip {...iconProps} />;
  }

  // Education
  if (iconName.includes('school') || iconName.includes('education')) {
    return <GraduationCap {...iconProps} />;
  }

  // Logout
  if (iconName.includes('logout')) {
    return <LogOut {...iconProps} />;
  }

  // Stars & Sparkles
  if (iconName.includes('star')) {
    return <Star {...iconProps} />;
  }
  if (iconName.includes('sparkle')) {
    return <Sparkles {...iconProps} />;
  }

  // UI Layers & Settings
  if (iconName.includes('layer')) {
    return <Layers {...iconProps} />;
  }
  if (iconName.includes('setting') || iconName.includes('gear')) {
    return <Settings {...iconProps} />;
  }
  if (iconName.includes('sun') || iconName.includes('light')) {
    return <Sun {...iconProps} />;
  }
  if (iconName.includes('moon') || iconName.includes('dark')) {
    return <Moon {...iconProps} />;
  }
  if (iconName.includes('activity') || iconName.includes('stats')) {
    return <Activity {...iconProps} />;
  }

  // WhatsApp brand icon
  if (iconName.includes('whatsapp')) {
    return <Image source={whatsappIcon} style={{ height: size, width: size, tintColor: color }} />;
  }

  // Default Fallback Icon
  return <Info {...iconProps} />;
};

export default MaterialDesignIcons;
