export const API_URL = "https://course-manager-backend-cd1m.onrender.com"; 

export const LANGUAGES = [
  "English", "Hindi", "Marathi", "Telugu", "Tamil", "Kannada", 
  "Malayalam", "Gujarati", "Bengali", "Odia", "Punjabi", 
  "French", "German", "Spanish", "Russian", "Chinese", "Mandarin Chinese", 
  "Japanese", "Thai", "Burmese", "Sinhala", "Nepali", 
  "Portuguese", "Vietnamese"
];

export const PROTECTED_ROOMS = new Set([
  "301AI","301BI","302AI","302BI","303AI","303BI","304AI","304BI","305AI","305BI","306AI","306BI","307AW","307BW","308AW","308BW","309AW","309BW","310AW","310BW","311AW","311BW","312AW","312BW","313AW","313BW","314AW","314BW","315AW","315BW","316AW","316BW","317AI","317BI","318AI","318BI","319AI","319BI","320AI","320BI","321AW","321BW","322AW","322BW","323AW","323BW","324AW","324BW","325AW","325BW","326AW","326BW","327AW","327BW","328AW","328BW","329AI","329BI","330AI","330BI","331AI","331BI","332AI","332BI","333AI","333BI","334AI","334BI","335AI","335BI","336AI","336BI","337AW","337BW","338AW","338BW","339AW","339BW","340AW","340BW","341AW","341BW","342AW","342BW","343AW","343BW","344AW","344BW","345AW","345BW","346AW","346BW","347AW","347BW","348AW","348BW","349AW","349BW","350AW","350BW","351AW","351BW","352AW","352BW","353AW","353BW","354AW","354BW","355AW","355BW","356AW","356BW","357AW","357BW","358AW","358BW","359AW","359BW","360AW","360BW","361AW","361BW","362AW","362BW","363AW","363BW",
  "201AI","201BI","202AI","202BI","203AI","203BI","213AW","213BW","214AW","214BW","215AW","215BW","216AW","216BW","217AW","217BW","218AW","218BW","219AW","219BW","220AW","220BW","221AW","221BW","222AW","222BW","223AW","223BW","224AW","224BW","225AW","225BW","226AW","226BW","227AW","227BW","228AI","228BI","229AI","229BI","230AI","230BI","231AW","231BW","232AW","232BW","233AW","233BW","234AW","234BW","235AW","235BW","236AW","236BW","237AW","237BW","238AW","238BW","239AW","239BW","240AW","240BW","241AW","241BW","242AW","242BW","243AW","243BW","244AW","244BW","245AW","245BW","246AW","246BW","247AW","247BW","248AW","248BW","DF1","DF2","DF3","DF4","DF5","DF6","FRC61W","FRC62W","FRC63W","FRC64W","FRC65W","FRC66W"
]);

export const NUMBER_OPTIONS = Array.from({length: 200}, (_, i) => i + 1);

// Shared Styles
export const styles = {
  btn: (isActive) => ({ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '20px', cursor: 'pointer', background: isActive ? '#007bff' : '#fff', color: isActive ? 'white' : '#555', fontWeight: '600', fontSize:'13px', display:'flex', alignItems:'center', gap:'5px' }),
  quickBtn: (isActive) => ({ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '15px', background: isActive ? '#007bff' : '#f1f1f1', color: isActive ? 'white' : 'black', cursor: 'pointer', fontSize: '13px' }),
  toolBtn: (bg) => ({ padding: '8px 16px', border: 'none', borderRadius: '20px', background: bg, color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px' }),
  card: { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' },
  label: { fontSize: '14px', color: '#555', fontWeight: 'bold', marginBottom: '5px', display: 'block' },
  th: { textAlign: 'left', padding: '8px', border: '1px solid #000', fontSize:'12px', color:'#000', textTransform:'uppercase', background:'#f0f0f0' },
  td: { padding: '8px', border: '1px solid #000', fontSize:'12px', verticalAlign:'middle' }
};

export const getSmartShortName = (name) => {
  if (!name) return 'Unknown';
  const n = name.toUpperCase();
  if (n.includes('45-DAY')) return '45D';
  if (n.includes('30-DAY')) return '30D';
  if (n.includes('20-DAY')) return '20D';
  if (n.includes('10-DAY')) return '10D';
  if (n.includes('SATIPATTHANA')) return 'ST';
  if (n.includes('SERVICE')) return 'SVC';
  return 'OTH';
};
