import type { BlogPost } from "./types";

import howToWriteDemandLetter from "@/content/blog/how-to-write-a-demand-letter.json";
import smallClaimsGuide from "@/content/blog/small-claims-court-canada-guide.json";
import contractorTookMyMoney from "@/content/blog/contractor-took-my-money.json";

export const blogPosts: BlogPost[] = [
  howToWriteDemandLetter as BlogPost,
  smallClaimsGuide as BlogPost,
  contractorTookMyMoney as BlogPost,
];
