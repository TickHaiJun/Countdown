export type HolidayKind = 'statutory';

/**
 * official  —— 国务院办公厅通知公布的放假安排（已含调休）
 * statutory —— 依《全国年节及纪念日放假办法》确定的法定节假日日期，未含调休
 */
export type HolidayConfidence = 'official' | 'statutory';

export interface HolidayPeriod {
  id: string;
  name: string;
  /** 英文名。法定节日用通行译名（中秋节 → Mid-Autumn Festival） */
  nameEn: string;
  kind: HolidayKind;
  /** 放假首日 00:00:00+08:00 */
  start: string;
  /** 放假末日 23:59:59+08:00 */
  end: string;
  /** 共放假天数（含首末日） */
  days: number;
  /** 调休上班日，YYYY-MM-DD */
  makeupWorkdays: string[];
  /** 农历描述（中文） */
  lunar?: string;
  /** 农历描述的拼音。按约定，农历日期与节气名不做意译 */
  lunarEn?: string;
  confidence: HolidayConfidence;
  source: string;
}

export interface ParsedHoliday extends HolidayPeriod {
  startMs: number;
  endMs: number;
}

export interface HolidayIndex {
  periods: ParsedHoliday[];
  /** 所有法定放假日（YYYY-MM-DD） */
  offDays: Set<string>;
  /** 所有调休上班日（YYYY-MM-DD） */
  makeupWorkdays: Set<string>;
}
