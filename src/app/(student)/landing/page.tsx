import Home from "@/src/components/ui/studentUi/home/Home";
import { getStudentHomeData } from "./data";

export const metadata = {
  title: "Home | The Quiver",
};

export default function StudentHomePage() {
  return <Home {...getStudentHomeData()} />;
}
