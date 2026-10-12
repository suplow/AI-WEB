export interface SectorItem {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  description: string;
  averagePE: number;
  averageROE: number;
  color: string;
  badgeBg: string;
  badgeText: string;
  stocks: {
    symbol: string;
    name: string;
    subIndustry: string;
  }[];
}

export const SECTOR_GROUPS: SectorItem[] = [
  {
    id: 'banking',
    name: 'Ngân hàng',
    shortName: 'Bank',
    icon: 'Landmark',
    description: 'Nhóm cổ phiếu vua dẫn dắt dòng tiền thị trường (VCB, TCB, MBB, CTG, ACB)',
    averagePE: 9.8,
    averageROE: 18.5,
    color: 'emerald',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-400 border-emerald-800/60',
    stocks: [
      { symbol: 'VCB', name: 'Vietcombank', subIndustry: 'Ngân hàng Quốc doanh' },
      { symbol: 'TCB', name: 'Techcombank', subIndustry: 'Ngân hàng TMCP Số' },
      { symbol: 'MBB', name: 'MBBank', subIndustry: 'Ngân hàng Quân đội' },
      { symbol: 'CTG', name: 'VietinBank', subIndustry: 'Ngân hàng Quốc doanh' },
      { symbol: 'ACB', name: 'Ngân hàng Á Châu', subIndustry: 'Bán lẻ & Quản trị rủi ro' },
      { symbol: 'VPB', name: 'VPBank', subIndustry: 'Tài chính tiêu dùng' },
      { symbol: 'STB', name: 'Sacombank', subIndustry: 'Tái cơ cấu nợ xấu' },
      { symbol: 'BID', name: 'BIDV', subIndustry: 'Ngân hàng Đầu tư' },
    ],
  },
  {
    id: 'real-estate',
    name: 'Bất động sản',
    shortName: 'BĐS',
    icon: 'Building2',
    description: 'Quỹ đất lớn, hưởng lợi từ tháo gỡ pháp lý và lãi suất thấp (VHM, VIC, KDH, NLG)',
    averagePE: 16.5,
    averageROE: 11.2,
    color: 'amber',
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-400 border-amber-800/60',
    stocks: [
      { symbol: 'VHM', name: 'Vinhomes', subIndustry: 'Đại đô thị phức hợp' },
      { symbol: 'VIC', name: 'Tập đoàn Vingroup', subIndustry: 'BĐS & Xe điện VinFast' },
      { symbol: 'KDH', name: 'Nhà Khang Điền', subIndustry: 'Pháp lý minh bạch' },
      { symbol: 'NLG', name: 'Nam Long', subIndustry: 'Nhà ở vừa túi tiền' },
      { symbol: 'DXG', name: 'Đất Xanh Group', subIndustry: 'Môi giới & Phát triển dự án' },
      { symbol: 'KBC', name: 'Kinh Bắc City', subIndustry: 'Bất động sản KCN' },
      { symbol: 'NVL', name: 'Novaland', subIndustry: 'Tái cơ cấu nợ trái phiếu' },
      { symbol: 'PDR', name: 'Phát Đạt', subIndustry: 'Dự án quỹ đất sạch' },
    ],
  },
  {
    id: 'technology',
    name: 'Công nghệ & Viễn thông',
    shortName: 'Công nghệ',
    icon: 'Cpu',
    description: 'Chuyển đổi số toàn cầu, Điện toán đám mây và Trí tuệ nhân tạo (AI)',
    averagePE: 23.5,
    averageROE: 26.8,
    color: 'cyan',
    badgeBg: 'bg-cyan-950/80',
    badgeText: 'text-cyan-400 border-cyan-800/60',
    stocks: [
      { symbol: 'FPT', name: 'Tập đoàn FPT', subIndustry: 'Xuất khẩu Phần mềm & AI' },
      { symbol: 'CMG', name: 'Tập đoàn CMC', subIndustry: 'Hạ tầng Data Center' },
      { symbol: 'FOX', name: 'Viễn thông FPT', subIndustry: 'Hạ tầng Internet cáp quang' },
      { symbol: 'VGI', name: 'Viettel Global', subIndustry: 'Viễn thông quốc tế' },
      { symbol: 'ELC', name: 'Công nghệ Elcom', subIndustry: 'Giao thông thông minh ITS' },
    ],
  },
  {
    id: 'steel-materials',
    name: 'Thép & Vật liệu xây dựng',
    shortName: 'Thép',
    icon: 'Hammer',
    description: 'Hưởng lợi giải ngân Đầu tư công, cao tốc và phục hồi chu kỳ bất động sản',
    averagePE: 14.8,
    averageROE: 13.5,
    color: 'orange',
    badgeBg: 'bg-orange-950/80',
    badgeText: 'text-orange-400 border-orange-800/60',
    stocks: [
      { symbol: 'HPG', name: 'Tập đoàn Hòa Phát', subIndustry: 'Thép xây dựng & Dung Quất 2' },
      { symbol: 'HSG', name: 'Tập đoàn Hoa Sen', subIndustry: 'Tôn mạ xuất khẩu' },
      { symbol: 'NKG', name: 'Thép Nam Kim', subIndustry: 'Tôn mạ & Thép cuộn' },
      { symbol: 'VCS', name: 'Vicostone', subIndustry: 'Đá thạch anh cao cấp' },
      { symbol: 'HT1', name: 'Xi măng Vicem Hà Tiên', subIndustry: 'Vật liệu hạ tầng' },
    ],
  },
  {
    id: 'securities',
    name: 'Chứng khoán',
    shortName: 'Chứng khoán',
    icon: 'LineChart',
    description: 'Động lực từ nâng hạng thị trường FTSE, hệ thống KRX và thanh khoản giao dịch',
    averagePE: 16.8,
    averageROE: 15.2,
    color: 'violet',
    badgeBg: 'bg-violet-950/80',
    badgeText: 'text-violet-400 border-violet-800/60',
    stocks: [
      { symbol: 'SSI', name: 'Chứng khoán SSI', subIndustry: 'Vốn lớn & Khách hàng tổ chức' },
      { symbol: 'VND', name: 'VNDIRECT', subIndustry: 'Bán lẻ & Môi giới đại chúng' },
      { symbol: 'VCI', name: 'Chứng khoán Vietcap', subIndustry: 'Ngân hàng đầu tư (IB)' },
      { symbol: 'HCM', name: 'HSC', subIndustry: 'Khối ngoại & Phái sinh' },
      { symbol: 'MBS', name: 'Chứng khoán MB', subIndustry: 'Hệ sinh thái MB Group' },
      { symbol: 'SHS', name: 'Chứng khoán SHS', subIndustry: 'Mảng tự doanh danh mục' },
    ],
  },
  {
    id: 'retail-consumer',
    name: 'Bán lẻ & Tiêu dùng',
    shortName: 'Bán lẻ',
    icon: 'ShoppingBag',
    description: 'Sức mua nội địa phục hồi, chuỗi bách hóa & thực phẩm thiết yếu có lãi ròng',
    averagePE: 19.2,
    averageROE: 21.0,
    color: 'rose',
    badgeBg: 'bg-rose-950/80',
    badgeText: 'text-rose-400 border-rose-800/60',
    stocks: [
      { symbol: 'MWG', name: 'Thế Giới Di Động', subIndustry: 'Bách Hóa Xanh & ICT' },
      { symbol: 'VNM', name: 'Vinamilk', subIndustry: 'Sữa & Thực phẩm dinh dưỡng' },
      { symbol: 'MSN', name: 'Masan Group', subIndustry: 'Tiêu dùng WinCommerce' },
      { symbol: 'PNJ', name: 'Vàng bạc PNJ', subIndustry: 'Bán lẻ trang sức cao cấp' },
      { symbol: 'FRT', name: 'FPT Retail', subIndustry: 'Chuỗi Nhà thuốc Long Châu' },
      { symbol: 'SAB', name: 'Sabeco', subIndustry: 'Bia & Đồ uống giải khát' },
    ],
  },
  {
    id: 'chemicals-oil',
    name: 'Hóa chất & Năng lượng',
    shortName: 'Hóa chất/Dầu khí',
    icon: 'FlaskConical',
    description: 'Phốt pho vàng cho chip bán dẫn AI, dịch vụ khoan dầu & khí LNG',
    averagePE: 15.2,
    averageROE: 22.4,
    color: 'teal',
    badgeBg: 'bg-teal-950/80',
    badgeText: 'text-teal-400 border-teal-800/60',
    stocks: [
      { symbol: 'DGC', name: 'Hóa chất Đức Giang', subIndustry: 'Phốt pho vàng & Bán dẫn' },
      { symbol: 'PVD', name: 'Khoan Dầu khí PVD', subIndustry: 'Giàn khoan tự nâng' },
      { symbol: 'PVS', name: 'Dịch vụ Kỹ thuật PVS', subIndustry: 'Điện gió ngoài khơi' },
      { symbol: 'GAS', name: 'Tổng công ty Khí VN', subIndustry: 'Hạ tầng kho cảng LNG' },
      { symbol: 'BSR', name: 'Lọc hóa dầu Bình Sơn', subIndustry: 'Nhà máy lọc dầu Dung Quất' },
      { symbol: 'DCM', name: 'Đạm Cà Mau', subIndustry: 'Phân bón & Hóa chất' },
    ],
  },
  {
    id: 'us-tech',
    name: 'Cổ phiếu Quốc tế (US Tech)',
    shortName: 'US Stocks',
    icon: 'Globe',
    description: 'Các tập đoàn công nghệ vốn hóa nghìn tỷ đô dẫn dắt xu hướng toàn cầu',
    averagePE: 31.5,
    averageROE: 32.0,
    color: 'indigo',
    badgeBg: 'bg-indigo-950/80',
    badgeText: 'text-indigo-400 border-indigo-800/60',
    stocks: [
      { symbol: 'AAPL', name: 'Apple Inc.', subIndustry: 'Consumer Tech & Services' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', subIndustry: 'AI GPU & Semiconductors' },
      { symbol: 'TSLA', name: 'Tesla Inc.', subIndustry: 'Xe điện & Robot tự hành' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', subIndustry: 'Cloud Azure & OpenAI' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', subIndustry: 'Search, Cloud & Gemini AI' },
    ],
  },
];
