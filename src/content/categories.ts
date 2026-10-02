/**
 * Medical subject areas shown on the home screen. A course belongs to one
 * category (course.json "category") and may also be listed under others
 * ("alsoIn"), e.g. the histology cell courses also appear under 細胞生物学.
 * Categories without courses are shown as 準備中 so the map of the curriculum
 * stays complete as lectures are added.
 */
export interface Category {
  id: string;
  name: string;
  en: string;
  /** one line: what the field covers */
  desc: string;
  /** icon key, see CategoryIcon */
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: 'histology', name: '組織学', en: 'HISTOLOGY', desc: '上皮組織・結合組織・細胞・核など', icon: 'histology' },
  { id: 'embryology', name: '人体発生学', en: 'EMBRYOLOGY', desc: '受精・初期発生・器官形成・系統発生', icon: 'embryology' },
  { id: 'genetics', name: '遺伝学', en: 'GENETICS', desc: '遺伝子の構造と機能・遺伝様式・染色体', icon: 'genetics' },
  { id: 'cell', name: '細胞生物学', en: 'CELL BIOLOGY', desc: '細胞小器官・細胞周期・膜輸送', icon: 'cell' },
  { id: 'biochemistry', name: '生化学', en: 'BIOCHEMISTRY', desc: '代謝・酵素・エネルギー産生', icon: 'biochemistry' },
  { id: 'physiology', name: '生理学', en: 'PHYSIOLOGY', desc: '循環・呼吸・腎・神経の働き', icon: 'physiology' },
  { id: 'anatomy', name: '解剖学', en: 'ANATOMY', desc: '骨格・筋・脈管・神経の構造', icon: 'anatomy' },
  { id: 'immunology', name: '免疫学', en: 'IMMUNOLOGY', desc: '自然免疫・獲得免疫・アレルギー', icon: 'immunology' },
  { id: 'pathology', name: '病理学', en: 'PATHOLOGY', desc: '炎症・腫瘍・循環障害', icon: 'pathology' },
  { id: 'pharmacology', name: '薬理学', en: 'PHARMACOLOGY', desc: '薬物動態・受容体・作用機序', icon: 'pharmacology' },
  { id: 'microbiology', name: '微生物学', en: 'MICROBIOLOGY', desc: '細菌・ウイルス・真菌・寄生虫', icon: 'microbiology' },
  { id: 'other', name: 'その他', en: 'OTHERS', desc: '医学概論・統計・そのほかの講義', icon: 'other' },
];

export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id);
