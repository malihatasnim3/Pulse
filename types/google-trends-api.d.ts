declare module "google-trends-api" {
  const googleTrends: {
    dailyTrends: (options: Record<string, any>) => Promise<string>;
    relatedQueries: (options: Record<string, any>) => Promise<string>;
    interestOverTime: (options: Record<string, any>) => Promise<string>;
  };
  export default googleTrends;
}
