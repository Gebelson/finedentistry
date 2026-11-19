import { HomeContent } from "@/components/home-page";
import { getHomeContent } from "@/lib/cms-content";
export const revalidate = 3600;
export default async function Home() {
  return <HomeContent content={await getHomeContent()} />;
}
