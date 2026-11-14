import Home from "@/src/components/ui/studentUi/home/Home";
import { getStudentHomeData } from "./data";

export const metadata = {
  title: "Home | The Quiver",
};

export default function StudentHomePage() {
  // dummy data for now
  const { forYou, fromYourOrgs, exploreMore, promoSlides } = getStudentHomeData();

  return (
    <Home
      forYou={forYou}
      fromYourOrgs={fromYourOrgs}
      exploreMore={exploreMore}
      promoSlides={promoSlides}
    />
  );
}