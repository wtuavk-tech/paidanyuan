import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { 
  Copy, 
  FileText, 
  CheckCircle, 
  Info, 
  Search, 
  AlertTriangle, 
  Trash2, 
  DollarSign, 
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Upload,
  Image as ImageIcon,
  Calendar,
  MessageCircle,
  Send,
  Smile,
  Video,
  Paperclip,
  User,
  ListFilter,
  SlidersHorizontal
} from 'lucide-react';

// --- 类型定义 ---

enum OrderStatus {
  PendingDispatch = '待派单',
  Completed = '已完成',
  Void = '作废',
  Returned = '已退回',
  Error = '报错'
}

interface Order {
  id: number;
  orderNo: string;
  workOrderNo: string;
  dispatchTime: string;
  mobile: string;
  serviceItem: string;
  serviceRatio: '3:7' | '2:8' | '4:6'; 
  status: OrderStatus;
  returnReason?: string; 
  errorDetail?: string; 
  region: string;
  address: string;
  details: string;
  recordTime: string;
  source: string;
  totalAmount: number;
  cost: number;
  hasAdvancePayment: boolean; 
  depositAmount?: number; 
}

// --- 辅助函数：智能金额格式化 ---
const formatCurrency = (amount: number) => {
  return Number.isInteger(amount) ? amount.toString() : amount.toFixed(1);
};

// --- 自动生成 128 条 Mock 数据 ---
const generateMockData = (): Order[] => {
  const services = ['家庭保洁日常', '深度家电清洗', '甲醛治理', '玻璃清洗', '管道疏通', '空调清洗', '开荒保洁', '收纳整理', '沙发清洗'];
  const regions = ['北京市/朝阳区', '上海市/浦东新区', '深圳市/南山区', '杭州市/西湖区', '成都市/武侯区', '广州市/天河区', '武汉市/江汉区', '南京市/鼓楼区'];
  const sources = ['小程序', '电话', '美团', '转介绍', '抖音', '58同城'];
  
  let pendingCount = 0;

  return Array.from({ length: 128 }).map((_, i) => {
    const id = i + 1;
    
    let status = OrderStatus.Completed;
    let returnReason = undefined;
    let errorDetail = undefined;

    if (pendingCount < 10 && i % 10 === 0) { 
      status = OrderStatus.PendingDispatch;
      pendingCount++;
    } else if (i % 15 === 1) {
      status = OrderStatus.Void;
    } else if (i % 15 === 2) {
      status = OrderStatus.Returned;
      returnReason = '客户改期/联系不上';
    } else if (i % 15 === 3) {
      status = OrderStatus.Error;
      errorDetail = '现场与描述不符，需加价';
    } else {
      status = OrderStatus.Completed;
    }

    const baseAddress = `${['阳光', '幸福', '金地', '万科', '恒大'][i % 5]}花园 ${i % 20 + 1}栋 ${i % 30 + 1}0${i % 4 + 1}室`;
    const extraInfo = `(需联系物业核实车位情况)`;
    const baseDetails = ['需带梯子，层高3.5米，有大型犬', '有宠物，需要发票，客户要求穿鞋套', '尽量上午，客户下午要出门', '需带吸尘器，重点清理地毯', '刚装修完，灰尘较大'][i % 5];

    return {
      id,
      orderNo: `ORD-20231027-${String(id).padStart(4, '0')}`,
      workOrderNo: `WO-${9980 + id}`,
      dispatchTime: `10-${27 + Math.floor(i/30)} ${String(8 + (i % 10)).padStart(2, '0')}:${String((i * 5) % 60).padStart(2, '0')}`,
      mobile: `13${i % 9 + 1}****${String(1000 + i).slice(-4)}`,
      serviceItem: services[i % services.length],
      serviceRatio: (['3:7', '4:6', '2:8'][i % 3]) as any,
      status,
      returnReason,
      errorDetail,
      region: regions[i % regions.length],
      address: baseAddress, 
      details: `${baseDetails} ${extraInfo}`,
      recordTime: `10-27 08:${String(i % 60).padStart(2, '0')}`,
      source: sources[i % sources.length],
      totalAmount: 150 + (i % 20) * 20,
      cost: (150 + (i % 20) * 20) * (i % 2 === 0 ? 0.6 : 0.7),
      hasAdvancePayment: i % 7 === 0,
      depositAmount: i % 12 === 0 ? 50 : undefined,
    };
  });
};

const FULL_MOCK_DATA = generateMockData();

// --- 组件部分 ---

const SearchPanel = ({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) => {
  const [timeType, setTimeType] = useState('create');
  const [personType, setPersonType] = useState('order');
  const [otherType, setOtherType] = useState('status');

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm mb-2 transition-all duration-300 ease-in-out">
      {!isOpen && (
        <div className="px-6 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors" onClick={onToggle}>
          <div className="flex items-center gap-2 text-gray-700">
             <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
               <Search size={14} />
             </div>
             <span className="text-sm font-bold">订单管理</span>
             <span className="text-xs text-gray-400 ml-2">点击展开搜索与操作面板</span>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      )}
      {isOpen && (
        <div className="p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <h2 className="text-xl font-extrabold text-gray-900 mb-5 pl-3 border-l-4 border-blue-600 tracking-tight">订单管理</h2>
          
          {/* 将所有搜索项放在同一行 (Flex Row), 间隔放大至 gap-16 (原来的30%以上) */}
          <div className="flex flex-wrap items-center gap-16 mb-5">
            
            {/* 1. 时间搜索 */}
            <div className="flex items-center gap-2 bg-blue-50/50 p-1.5 rounded-md border border-blue-100 shadow-sm">
              <div className="text-blue-400 px-1"><Calendar size={16} /></div>
              <div className="relative">
                <select 
                  value={timeType}
                  onChange={(e) => setTimeType(e.target.value)}
                  className="h-7 pl-1 pr-6 border-none bg-transparent text-xs font-bold text-gray-700 focus:ring-0 appearance-none cursor-pointer outline-none"
                >
                  <option value="create">创建时间</option>
                  <option value="finish">完成时间</option>
                  <option value="payment">收款时间</option>
                </select>
                <ChevronDown size={12} className="absolute right-1 top-2 text-gray-500 pointer-events-none"/>
              </div>
              <div className="flex items-center gap-1">
                 <input type="datetime-local" className="h-7 px-2 border border-blue-200 rounded text-xs w-[140px] focus:outline-none focus:border-blue-500 bg-white text-gray-600" />
                 <span className="text-blue-300 text-xs">-</span>
                 <input type="datetime-local" className="h-7 px-2 border border-blue-200 rounded text-xs w-[140px] focus:outline-none focus:border-blue-500 bg-white text-gray-600" />
              </div>
            </div>

            {/* 2. 人员搜索 */}
            <div className="flex items-center gap-2 bg-blue-50/50 p-1.5 rounded-md border border-blue-100 shadow-sm">
              <div className="text-blue-400 px-1"><User size={16} /></div>
              <div className="relative">
                <select 
                  value={personType}
                  onChange={(e) => setPersonType(e.target.value)}
                  className="h-7 pl-1 pr-6 border-none bg-transparent text-xs font-bold text-gray-700 focus:ring-0 appearance-none cursor-pointer outline-none"
                >
                  <option value="order">订单号/手机/客户</option>
                  <option value="master">师傅</option>
                  <option value="dispatcher">派单员</option>
                </select>
                <ChevronDown size={12} className="absolute right-1 top-2 text-gray-500 pointer-events-none"/>
              </div>
              <div>
                 <input type="text" className="h-7 px-2 w-[160px] border border-blue-200 rounded text-xs focus:border-blue-500 focus:outline-none bg-white placeholder-gray-400" placeholder={`请输入${personType === 'master' ? '师傅姓名' : personType === 'dispatcher' ? '派单员姓名' : '关键字'}...`} />
              </div>
            </div>

            {/* 3. 其他搜索 */}
            <div className="flex items-center gap-2 bg-blue-50/50 p-1.5 rounded-md border border-blue-100 shadow-sm">
              <div className="text-blue-400 px-1"><SlidersHorizontal size={16} /></div>
              <div className="relative">
                <select 
                  value={otherType}
                  onChange={(e) => setOtherType(e.target.value)}
                  className="h-7 pl-1 pr-6 border-none bg-transparent text-xs font-bold text-gray-700 focus:ring-0 appearance-none cursor-pointer outline-none"
                >
                  <option value="status">状态</option>
                  <option value="service">服务项目</option>
                  <option value="region">地域</option>
                  <option value="source">来源</option>
                  <option value="dispatch">派单方式</option>
                </select>
                <ChevronDown size={12} className="absolute right-1 top-2 text-gray-500 pointer-events-none"/>
              </div>
              <div className="w-[160px]">
                 {otherType === 'status' ? (
                   <div className="relative w-full">
                      <select className="h-7 w-full px-2 border border-blue-200 rounded text-xs focus:border-blue-500 focus:outline-none bg-white appearance-none cursor-pointer text-gray-600">
                        <option value="">全部状态</option>
                        <option value="PendingDispatch">待派单</option>
                        <option value="Completed">已完成</option>
                        <option value="Void">作废</option>
                        <option value="Returned">已退回</option>
                        <option value="Error">报错</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-2 text-gray-400 pointer-events-none"/>
                   </div>
                 ) : otherType === 'source' ? (
                    <div className="relative w-full">
                      <select className="h-7 w-full px-2 border border-blue-200 rounded text-xs focus:border-blue-500 focus:outline-none bg-white appearance-none cursor-pointer text-gray-600">
                        <option value="">全部来源</option>
                        <option value="App">小程序</option>
                        <option value="Phone">电话</option>
                        <option value="Meituan">美团</option>
                        <option value="Douyin">抖音</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-2 text-gray-400 pointer-events-none"/>
                   </div>
                 ) : otherType === 'dispatch' ? (
                    <div className="relative w-full">
                      <select className="h-7 w-full px-2 border border-blue-200 rounded text-xs focus:border-blue-500 focus:outline-none bg-white appearance-none cursor-pointer text-gray-600">
                        <option value="">全部方式</option>
                        <option value="Auto">系统派单</option>
                        <option value="Manual">人工派单</option>
                        <option value="Grab">抢单</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-2 text-gray-400 pointer-events-none"/>
                   </div>
                 ) : (
                   <input type="text" className="h-7 px-2 w-full border border-blue-200 rounded text-xs focus:border-blue-500 focus:outline-none bg-white placeholder-gray-400" placeholder="请输入..." />
                 )}
              </div>
            </div>

            {/* 按钮组 */}
            <div className="flex items-center gap-3 ml-auto">
              <button onClick={onToggle} className="h-8 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors flex items-center justify-center gap-1.5 shadow-sm font-bold">
                <Search size={14} />搜索
              </button>
              <button className="h-8 px-4 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs rounded transition-colors font-medium">重置</button>
               <button onClick={onToggle} className="h-8 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded transition-colors flex items-center justify-center gap-1 border border-transparent hover:border-gray-300">
                 <ChevronUp size={14}/> 收起
              </button>
            </div>

          </div>

          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
             <div className="flex items-center gap-3 flex-wrap">
                <button className="h-7 w-24 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors shadow-sm font-medium flex items-center justify-center">录单</button>
                <button className="h-7 w-24 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition-colors shadow-sm font-medium flex items-center justify-center">快找</button>
                <div className="h-4 w-px bg-gray-300 mx-1"></div>
                <button className="h-7 px-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs rounded transition-colors font-medium shadow-sm">批量完成</button>
                <button className="h-7 px-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs rounded transition-colors font-medium shadow-sm">批量作废</button>
                <button className="h-7 px-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs rounded transition-colors font-medium shadow-sm">存疑号码</button>
                 <button className="h-7 px-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs rounded transition-colors font-medium shadow-sm">黑名单查询</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ... TooltipCell and ServiceItemCell remain unchanged ...
const TooltipCell = ({ content, maxWidthClass = "max-w-[100px]", showTooltip }: { content: string, maxWidthClass?: string, showTooltip: boolean }) => {
  return (
    <div className={`relative ${maxWidthClass}`}>
      <div className="truncate text-[10px] leading-tight text-gray-600 cursor-default">
        {content}
      </div>
      {showTooltip && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-gray-800 text-white text-xs p-3 rounded shadow-lg z-[70] whitespace-normal break-words animate-in fade-in duration-150">
          {content}
          <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-800"></div>
        </div>
      )}
    </div>
  );
}

const ServiceItemCell = ({ item, ratio, rowIndex, showTooltip }: { item: string; ratio: string; rowIndex: number; showTooltip: boolean }) => {
  const getMockDetails = (name: string) => {
    const isHighValue = name.includes('深度') || name.includes('甲醛') || name.includes('玻璃');
    return {
      dispatchMethod: isHighValue ? '优先指派' : '全网抢单',
      historyPrice: isHighValue ? '350 - 1200' : '150 - 220', 
      basePrice: isHighValue ? '200' : '80' 
    };
  };

  const details = getMockDetails(item);
  const isTopRow = rowIndex < 2;
  const tooltipPositionClass = isTopRow ? 'top-full mt-2' : 'bottom-full mb-2';
  const arrowPositionClass = isTopRow ? 'bottom-full -mb-1 border-b-gray-800' : 'top-full -mt-1 border-t-gray-800';

  return (
    <div className="relative inline-block cursor-help py-1">
      <span className="font-medium text-gray-700 border-b border-dashed border-gray-300 pb-0.5 transition-colors group-hover:border-blue-400 group-hover:text-blue-600">
        {item}
      </span>
      {showTooltip && (
        <div className={`absolute left-0 w-64 bg-gray-800 text-white text-xs rounded-lg shadow-xl p-4 z-[60] text-left animate-in fade-in duration-200 ${tooltipPositionClass}`}>
           <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-600 pb-2">
                <span className="text-gray-400">建议分成比例</span>
                <span className="font-bold text-yellow-400 text-sm">{ratio}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">建议派单方式</span>
                <span className="font-medium">{details.dispatchMethod}</span>
              </div>
               <div className="flex justify-between items-center">
                <span className="text-gray-400">历史成交价</span>
                <span className="font-medium">{details.historyPrice}</span>
              </div>
               <div className="flex justify-between items-center">
                <span className="text-gray-400">师傅成交底价</span>
                <span className="font-medium text-green-300">{details.basePrice}</span>
              </div>
           </div>
           <div className={`absolute left-4 border-4 border-transparent ${arrowPositionClass}`}></div>
        </div>
      )}
    </div>
  );
};

const StatusCell = ({ order }: { order: Order }) => {
  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PendingDispatch: return 'bg-orange-100 text-orange-700 border border-orange-200';
      case OrderStatus.Returned: return 'bg-red-100 text-red-700 border border-red-200';
      case OrderStatus.Error: return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case OrderStatus.Void: return 'bg-gray-100 text-gray-500 border border-gray-200';
      case OrderStatus.Completed: return 'bg-green-100 text-green-700 border border-green-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="flex flex-col items-start justify-center h-full">
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${getStatusStyle(order.status)}`}>
        {order.status}
      </span>
      {order.status === OrderStatus.Returned && order.returnReason && (
        <span className="text-[10px] text-red-500 mt-0.5 max-w-[140px] leading-tight text-left block">
          {order.returnReason}
        </span>
      )}
      {order.status === OrderStatus.Error && order.errorDetail && (
        <div className="mt-0.5 flex flex-col items-start">
          <span className="text-[10px] text-yellow-700 bg-yellow-50 px-1 py-0 rounded border border-yellow-200 max-w-[140px] truncate block" title={order.errorDetail}>
            {order.errorDetail}
          </span>
        </div>
      )}
    </div>
  );
};

// 1. Dispatch Cell Updated: Copy functionality
const DispatchCell = ({ order }: { order: Order }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = `订单号：${order.orderNo}\n手机号：${order.mobile}\n服务项目：${order.serviceItem}\n地域：${order.region}\n详细地址：${order.address}\n详情：${order.details}`;
    try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } catch (err) {
        alert("复制失败");
    }
  };

  if (order.status === OrderStatus.PendingDispatch) {
    return (
      <button 
        onClick={handleCopy}
        className={`px-2.5 py-1 ${copied ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'} text-white text-[10px] rounded shadow-sm font-medium transition-colors min-w-[50px]`}
      >
        {copied ? '已复制' : '派单'}
      </button>
    );
  }
  return (
    <span className="text-[10px] text-gray-400 font-medium select-none">
      已派单
    </span>
  );
};

const OrderNoCell = ({ orderNo, hasAdvancePayment, depositAmount }: { orderNo: string; hasAdvancePayment: boolean; depositAmount?: number }) => {
  return (
    <div className="relative group flex flex-col items-start gap-0.5 justify-center h-full">
      <span className="text-gray-900 font-medium select-all font-mono tracking-tight">{orderNo}</span>
      <div className="flex gap-1">
        {hasAdvancePayment && (
          <span className="bg-rose-500 text-white text-[10px] px-1 py-0 rounded shadow-sm whitespace-nowrap">
            已垫款
          </span>
        )}
        {depositAmount && depositAmount > 0 && (
          <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px] px-1 py-0 rounded shadow-sm whitespace-nowrap">
            定金{depositAmount}
          </span>
        )}
      </div>
    </div>
  );
};

const ActionCell = ({ orderId, onAction }: { orderId: number; onAction: (action: string, id: number) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        const menuElement = document.getElementById(`action-menu-${orderId}`);
        if (menuElement && !menuElement.contains(event.target as Node)) {
             setIsOpen(false);
        }
      }
    };
    const handleScroll = () => { if(isOpen) setIsOpen(false); }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true); 
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, orderId]);

  const toggleMenu = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 5,
        left: rect.right - 128
      });
    }
    setIsOpen(!isOpen);
  };

  const handleActionClick = (actionName: string) => {
    setIsOpen(false);
    onAction(actionName, orderId);
  };

  const menuItems = [
    { name: '复制订单', icon: Copy, color: 'text-gray-600' },
    { name: '开票', icon: FileText, color: 'text-blue-600' },
    { name: '完单', icon: CheckCircle, color: 'text-green-600' },
    { name: '详情', icon: Info, color: 'text-gray-600' },
    { name: '查资源', icon: Search, color: 'text-purple-600' },
    { name: '添加报错', icon: AlertTriangle, color: 'text-orange-600' },
    { name: '作废', icon: Trash2, color: 'text-red-600' },
    { name: '其他收款', icon: DollarSign, color: 'text-teal-600' },
  ];

  return (
    <>
      <button ref={buttonRef} onClick={toggleMenu} className={`px-2 py-1 rounded text-[10px] font-medium transition-all flex items-center justify-center gap-0.5 border ${isOpen ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300'}`}>
        操作 <ChevronDown size={10} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && createPortal(
        <div id={`action-menu-${orderId}`} className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 w-32" style={{ top: menuPosition.top, left: menuPosition.left }}>
          <div className="py-1">
            {menuItems.map((item, index) => (
              <button key={index} onClick={() => handleActionClick(item.name)} className="w-full text-left px-3 py-2 text-xs flex items-center hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 group">
                <item.icon size={13} className={`mr-2 transition-transform group-hover:scale-110 ${item.color}`} />
                <span className="text-gray-700 font-medium">{item.name}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const ChatModal = ({ isOpen, onClose, role, order }: { isOpen: boolean; onClose: () => void; role: string; order: Order | null }) => {
  if (!isOpen || !order) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl w-[800px] h-[600px] flex overflow-hidden">
        <div className="w-1/4 bg-gray-50 border-r border-gray-200 flex flex-col items-center pt-10 px-4">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4 border-2 border-white shadow-sm"><User size={40} className="text-blue-500"/></div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">{role}</h3>
          <p className="text-xs text-gray-500 mb-6 text-center">订单号: {order.orderNo}</p>
          <div className="w-full space-y-2">
             <div className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-2 text-center">当前状态</div>
             <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 py-1.5 rounded-md border border-green-100"><span className="w-2 h-2 rounded-full bg-green-500"></span> 在线</div>
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-white">
          <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
            <div><h2 className="font-bold text-gray-800">与 {role} 对话中</h2><p className="text-xs text-gray-500">通常在 2 分钟内回复</p></div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
             <div className="text-center text-xs text-gray-400 my-4">今天 10:23</div>
             <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 text-xs font-bold">{role[0]}</div><div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%]"><p className="text-sm text-gray-700">您好，我是本单的{role}，请问有什么可以帮您？</p></div></div>
             <div className="flex gap-3 flex-row-reverse"><div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-600 text-xs font-bold">我</div><div className="bg-blue-600 p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[80%] text-white"><p className="text-sm">好的，我这边需要核实一下费用问题。</p></div></div>
          </div>
          <div className="border-t border-gray-200 p-4 bg-white">
             <div className="flex gap-4 mb-3 px-1 text-gray-500">
                <button className="hover:text-blue-600 transition-colors"><ImageIcon size={20}/></button>
                <button className="hover:text-blue-600 transition-colors"><Video size={20}/></button>
                <button className="hover:text-blue-600 transition-colors"><Paperclip size={20}/></button>
                <button className="hover:text-blue-600 transition-colors"><Smile size={20}/></button>
             </div>
             <textarea className="w-full h-20 resize-none outline-none text-sm text-gray-700 placeholder-gray-400" placeholder="请输入消息... (按 Enter 发送)"></textarea>
             <div className="flex justify-end mt-2"><button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"><span>发送</span><Send size={14} /></button></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CompleteOrderModal = ({ isOpen, onClose, order }: { isOpen: boolean; onClose: () => void; order: Order | null }) => {
  const [paymentMethod, setPaymentMethod] = useState<'platform' | 'offline'>('offline');
  const [isUploaded, setIsUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  useEffect(() => { if (!isOpen) { setPaymentMethod('offline'); setIsUploaded(false); setIsUploading(false); } }, [isOpen]);
  if (!isOpen || !order) return null;
  const handleUpload = () => { setIsUploading(true); setTimeout(() => { setIsUploading(false); setIsUploaded(true); }, 1500); };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">完成订单 <span className="text-gray-500 font-mono text-lg font-normal ml-2">{order.orderNo}</span></h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"><X size={24} /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-5"><label className="block text-sm font-medium text-gray-700 mb-1"><span className="text-red-500 mr-1">*</span>总收款</label><input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="总收款" defaultValue={order.totalAmount} /></div>
            <div className="col-span-5"><label className="block text-sm font-medium text-gray-700 mb-1"><span className="text-red-500 mr-1">*</span>配件成本</label><input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="0" /></div>
          </div>
           <div className="grid grid-cols-12 gap-6 items-end">
            <div className="col-span-5"><label className="block text-sm font-medium text-gray-700 mb-1">业绩</label><input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm" placeholder="0" readOnly /></div>
             <div className="col-span-7 pb-0.5"><div className="flex items-center gap-4"><button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium transition-colors shadow-sm"><Plus size={16} className="mr-1.5"/> 添加收款记录</button><div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 bg-white flex-1 max-w-xs"><Calendar size={16} className="text-gray-400"/><span className="text-sm text-gray-400">选择收款日期</span></div></div></div>
          </div>
          <div className="border-t border-gray-100 my-2"></div>
          <div className="grid grid-cols-3 gap-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">师傅名字</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="请输入内容" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">线下师傅手机</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="请输入师傅手机号" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">师傅状态</label><div className="relative"><select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white"><option>请选择师傅状态</option><option>正常</option><option>异常</option></select><ChevronDown size={16} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none"/></div></div>
          </div>
          <div className="space-y-3">
             <div className="flex items-center gap-2"><span className="text-red-500 text-sm">*</span><span className="text-sm font-medium text-gray-700">收款记录</span></div>
             <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-200 border-l-4 border-l-blue-500">
                <div className="w-1/5 min-w-[160px]"><label className="block text-xs font-medium text-gray-500 mb-1">收款方式</label><div className="relative"><select value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value as 'platform' | 'offline'); if (e.target.value === 'platform') setIsUploaded(false); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white appearance-none"><option value="platform">平台收款</option><option value="offline">线下收款</option></select><ChevronDown size={16} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none"/></div></div>
                <div className="flex-1">
                   {paymentMethod === 'platform' && !isUploaded ? (
                     <div className="flex flex-col gap-1"><label className="block text-xs font-medium text-gray-500 mb-1">师傅收款码</label><div onClick={handleUpload} className="border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg h-[84px] flex flex-col items-center justify-center cursor-pointer group">{isUploading ? (<div className="flex items-center gap-2 text-blue-600"><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div><span className="text-sm">上传中...</span></div>) : (<><Upload size={20} className="text-blue-500 mb-1 group-hover:scale-110 transition-transform"/><span className="text-xs text-blue-600 font-medium">点击上传收款码</span></>)}</div></div>
                   ) : (
                     <div className="flex gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                        {paymentMethod === 'platform' && isUploaded && (<div className="w-[100px] flex-shrink-0"><label className="block text-xs font-medium text-gray-500 mb-1">收款码</label><div className="h-[38px] w-full bg-green-50 border border-green-200 rounded text-green-700 text-xs flex items-center justify-center gap-1 cursor-pointer" onClick={() => setIsUploaded(false)} title="点击重新上传"><CheckCircle size={12}/> 已上传</div></div>)}
                        <div className="flex-1"><label className="block text-xs font-medium text-gray-500 mb-1">业绩</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="收款金额" /></div>
                        <div className="flex-1"><label className="block text-xs font-medium text-gray-500 mb-1">核销券码</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="核销券" /></div>
                        <div className="flex-1"><label className="block text-xs font-medium text-gray-500 mb-1">收款时间</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="选择日期时间" /></div>
                        <div className="flex-[1.5]"><label className="block text-xs font-medium text-gray-500 mb-1">备注</label><div className="flex gap-2"><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="备注" /><button className="text-red-400 hover:text-red-600 transition-colors p-2"><Trash2 size={16}/></button></div></div>
                     </div>
                   )}
                </div>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-6 pt-4">
             <div><label className="block text-sm font-medium text-gray-700 mb-1">实付金额</label><input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm" placeholder="0" defaultValue={0} /></div>
             <div><label className="block text-sm font-medium text-gray-700 mb-1">垫付金额</label><input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm" placeholder="0" defaultValue={0} /></div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl">
          <button onClick={onClose} className="px-5 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">取消</button>
          <button onClick={() => { alert('保存成功'); onClose(); }} className="px-5 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 shadow-sm transition-colors">确定</button>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false); 
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; 
  
  // 4. 排序逻辑：待派单永远在最前面
  const sortedData = [...FULL_MOCK_DATA].sort((a, b) => {
    if (a.status === OrderStatus.PendingDispatch && b.status !== OrderStatus.PendingDispatch) return -1;
    if (a.status !== OrderStatus.PendingDispatch && b.status === OrderStatus.PendingDispatch) return 1;
    return 0;
  });

  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
  const [chatState, setChatState] = useState<{isOpen: boolean; role: string; order: Order | null;}>({ isOpen: false, role: '', order: null });
  
  // --- New State for Strictly Controlled Tooltips ---
  const [hoveredTooltipCell, setHoveredTooltipCell] = useState<{rowId: number, colKey: 'address' | 'details' | 'service'} | null>(null);

  const handleAction = (action: string, id: number) => {
    const order = sortedData.find(o => o.id === id);
    if (!order) return;
    if (action === '完单') { setCurrentOrder(order); setCompleteModalOpen(true); } 
    else { alert(`已执行操作：${action} (订单ID: ${id})`); }
  };

  const handleOpenChat = (role: string, order: Order) => { setChatState({ isOpen: true, role, order }); };
  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  // Generic handler to clear tooltips when hovering over anything else
  const handleMouseEnterOther = () => {
    setHoveredTooltipCell(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 to-slate-300 p-6 flex flex-col">
      <div className="max-w-[1800px] mx-auto w-full flex-1 flex flex-col">
        <SearchPanel isOpen={isSearchOpen} onToggle={() => setIsSearchOpen(!isSearchOpen)} />
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
          <div className="overflow-x-auto flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20 shadow-sm">
                <tr className="bg-slate-50 border-b-2 border-gray-300 text-xs font-bold uppercase text-gray-700 tracking-wider">
                  <th className="px-4 py-2 whitespace-nowrap">手机号</th>
                  <th className="px-4 py-2 min-w-[120px] whitespace-nowrap">服务项目</th>
                  <th className="px-4 py-2 whitespace-nowrap">状态</th>
                  <th className="px-4 py-2 whitespace-nowrap">地域</th>
                  <th className="px-4 py-2 max-w-[100px] whitespace-nowrap">详细地址</th> {/* Reduced width */}
                  <th className="px-4 py-2 max-w-[140px] whitespace-nowrap">详情</th>
                  <th className="px-4 py-2 text-right whitespace-nowrap">总收款</th>
                  <th className="px-4 py-2 text-right whitespace-nowrap">业绩</th>
                  <th className="px-4 py-2 text-right whitespace-nowrap">成本</th>
                  <th className="px-4 py-2 whitespace-nowrap">来源</th>
                  <th className="px-4 py-2 min-w-[160px] whitespace-nowrap">订单号</th>
                  <th className="px-4 py-2 whitespace-nowrap">工单号</th>
                  <th className="px-4 py-2 whitespace-nowrap">录单时间</th> {/* Moved Record Time before Dispatch Time */}
                  <th className="px-4 py-2 whitespace-nowrap">派单时间</th>
                  <th className="px-4 py-2 whitespace-nowrap text-center">联系人</th>
                  <th className="px-4 py-2 whitespace-nowrap text-center">派单</th> 
                  <th className="px-4 py-2 text-center sticky right-0 bg-slate-50 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.05)] z-10 whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {currentData.map((order, index) => (
                  <tr 
                    key={order.id} 
                    onMouseLeave={handleMouseEnterOther} // Clear all tooltips when leaving row
                    className="bg-white even:bg-blue-50 hover:!bg-blue-100 transition-colors group text-xs border-b border-gray-300 last:border-0 align-middle"
                  >
                    <td className="px-4 py-2 text-gray-800 font-bold tabular-nums whitespace-nowrap align-middle" onMouseEnter={handleMouseEnterOther}>{order.mobile}</td>
                    
                    {/* Service Item - using state for strict left-side logic */}
                    <td className="px-4 py-2 align-middle whitespace-nowrap" onMouseEnter={() => setHoveredTooltipCell({rowId: order.id, colKey: 'service'})}>
                      <ServiceItemCell item={order.serviceItem} ratio={order.serviceRatio} rowIndex={index} showTooltip={hoveredTooltipCell?.rowId === order.id && hoveredTooltipCell?.colKey === 'service'} />
                    </td>
                    
                    {/* Status */}
                    <td className="px-4 py-2 align-middle" onMouseEnter={() => setHoveredTooltipCell({rowId: order.id, colKey: 'service'})}>
                      <StatusCell order={order} />
                    </td>
                    
                    <td className="px-4 py-2 text-gray-700 whitespace-nowrap align-middle" onMouseEnter={handleMouseEnterOther}>{order.region}</td>
                    
                    {/* Address - STRICT STATE CONTROL */}
                    <td className="px-4 py-2 align-middle" onMouseEnter={() => setHoveredTooltipCell({rowId: order.id, colKey: 'address'})}>
                      <TooltipCell content={order.address} maxWidthClass="max-w-[100px]" showTooltip={hoveredTooltipCell?.rowId === order.id && hoveredTooltipCell?.colKey === 'address'} />
                    </td>
                    
                    {/* Details - STRICT STATE CONTROL */}
                    <td className="px-4 py-2 align-middle" onMouseEnter={() => setHoveredTooltipCell({rowId: order.id, colKey: 'details'})}>
                      <TooltipCell content={order.details} maxWidthClass="max-w-[140px]" showTooltip={hoveredTooltipCell?.rowId === order.id && hoveredTooltipCell?.colKey === 'details'} />
                    </td>
                    
                    {/* All other columns clear the state. Use formatCurrency helper */}
                    <td className="px-4 py-2 text-right font-bold text-gray-900 tabular-nums align-middle whitespace-nowrap" onMouseEnter={handleMouseEnterOther}>{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-2 text-right font-bold text-green-600 tabular-nums align-middle whitespace-nowrap" onMouseEnter={handleMouseEnterOther}>{formatCurrency(order.totalAmount - order.cost)}</td>
                    <td className="px-4 py-2 text-right text-gray-500 font-medium tabular-nums align-middle whitespace-nowrap" onMouseEnter={handleMouseEnterOther}>{formatCurrency(order.cost)}</td>

                    <td className="px-4 py-2 align-middle" onMouseEnter={handleMouseEnterOther}><span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] border border-gray-200 whitespace-nowrap">{order.source}</span></td>
                    <td className="px-4 py-2 align-middle" onMouseEnter={handleMouseEnterOther}><OrderNoCell orderNo={order.orderNo} hasAdvancePayment={order.hasAdvancePayment} depositAmount={order.depositAmount} /></td>
                    <td className="px-4 py-2 text-gray-500 font-mono text-[10px] whitespace-nowrap align-middle" onMouseEnter={handleMouseEnterOther}>{order.workOrderNo}</td>
                    <td className="px-4 py-2 text-gray-400 text-[10px] whitespace-nowrap tabular-nums align-middle" onMouseEnter={handleMouseEnterOther}>{order.recordTime}</td>
                    <td className="px-4 py-2 text-gray-500 text-[10px] whitespace-nowrap tabular-nums align-middle" onMouseEnter={handleMouseEnterOther}>{order.dispatchTime}</td>
                    <td className="px-4 py-2 align-middle text-center" onMouseEnter={handleMouseEnterOther}><div className="flex flex-row gap-1 justify-center items-center"><button onClick={() => handleOpenChat('客服', order)} className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 bg-white hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors whitespace-nowrap">客服</button><button onClick={() => handleOpenChat('运营', order)} className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 bg-white hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors whitespace-nowrap">运营</button><button onClick={() => handleOpenChat('售后', order)} className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 bg-white hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors whitespace-nowrap">售后</button></div></td>
                    
                    <td className="px-4 py-2 text-center whitespace-nowrap" onMouseEnter={handleMouseEnterOther}>
                      <DispatchCell order={order} />
                    </td>

                    <td className="px-4 py-2 text-center sticky right-0 bg-slate-50 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.05)] z-10 whitespace-nowrap" onMouseEnter={handleMouseEnterOther}><ActionCell orderId={order.id} onAction={handleAction} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white px-6 py-3 border-t border-gray-200 flex justify-between items-center">
             <span className="text-xs text-gray-500">显示 {((currentPage - 1) * pageSize) + 1} 到 {Math.min(currentPage * pageSize, totalItems)} 条，共 {totalItems} 条订单</span>
             <div className="flex gap-1">
               <button onClick={handlePrevPage} disabled={currentPage === 1} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-600 text-xs hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">上一页</button>
               <button className="px-2 py-1 border border-blue-600 rounded-md bg-blue-600 text-white text-xs font-medium shadow-sm">{currentPage}</button>
               <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-600 text-xs hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">下一页</button>
             </div>
          </div>
        </div>
      </div>
      <CompleteOrderModal isOpen={completeModalOpen} onClose={() => setCompleteModalOpen(false)} order={currentOrder} />
      <ChatModal isOpen={chatState.isOpen} onClose={() => setChatState(prev => ({ ...prev, isOpen: false }))} role={chatState.role} order={chatState.order} />
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}