declare module 'astronomia' {
  export const julian: {
    DateToJD(date: Date): number;
    JDToDate(jd: number): Date;
  };

  export const solar: {
    apparentLongitude(T: number): number;
    true(T: number): { lon: number; ano: number };
  };

  export const base: {
    J2000Century(jd: number): number;
    pmod(x: number, y: number): number;
    horner(x: number, ...coeffs: number[]): number;
  };
}
