export interface ReelCreator {
  name: string;
  username: string;
  avatar: string;
  verified?: boolean;
}

export interface ReelScene {
  sequence?: number;
  title: string;
  narration: string;
  visualLabel: string;
}

export interface ReelItem {
  id: string;
  projectId?: string;
  title: string;
  topic: string;
  videoUrl: string;
  posterUrl?: string;
  creator: ReelCreator;
  likes: number;
  isLiked?: boolean;
  commentsCount: number;
  sharesCount: number;
  voiceName: string;
  duration: number; // in seconds
  caption: string;
  tags: string[];
  scenes?: ReelScene[];
  createdAt?: string;
}

/**
 * Built-in featured library of explainer reels to ensure rich, instant discoverability
 * in the Instagram Reels feed even on first install or before rendering custom projects.
 */
export const FEATURED_REELS: ReelItem[] = [
  {
    id: "reel-memory-arch",
    projectId: "6ae8a6752f03352ee47aeafd",
    title: "Computer Memory Architecture Explained",
    topic: "Computer Memory Architecture: Registers vs RAM vs SSD",
    videoUrl: "/videos/6ae8a6752f03352ee47aeafd.mp4",
    posterUrl: "/renders/preview_frame_01.jpg",
    creator: {
      name: "Vidya Tech",
      username: "vidya.systems",
      avatar: "⚡",
      verified: true,
    },
    likes: 3840,
    isLiked: false,
    commentsCount: 142,
    sharesCount: 890,
    voiceName: "Madhur (Hinglish 🇮🇳)",
    duration: 58,
    caption:
      "Why is RAM so much faster than SSD? Breakdown of CPU Registers, L1/L2/L3 Cache, RAM and NVMe storage hierarchy in under 60 seconds! ⚡💾 #compsci #memory #hardware #engineering #coding #reels",
    tags: ["Tech", "Computer Architecture", "Hardware", "Hinglish"],
    scenes: [
      {
        sequence: 1,
        title: "The Speed Bottleneck",
        narration:
          "Agar CPU ek super-fast chef hai, toh uske ingredients kahan stored hain? Registers, RAM ya SSD mein?",
        visualLabel: "CPU to Storage Pyramid",
      },
      {
        sequence: 2,
        title: "Registers & Cache Hierarchy",
        narration:
          "CPU ke andar registers nanosecond se bhi fast hote hain, par unka size bohot chhota hota hai.",
        visualLabel: "L1/L2/L3 Latency Ladder",
      },
      {
        sequence: 3,
        title: "RAM vs Permanent SSD",
        narration:
          "RAM volatile memory hai jo current running apps hold karti hai. SSD permanent hai par RAM se 100 guna slow.",
        visualLabel: "Throughput Comparison",
      },
      {
        sequence: 4,
        title: "Key Takeaway",
        narration:
          "Isliye high-performance code data locality utilize karta hai taaki cache miss minimum ho!",
        visualLabel: "Summary Pillar",
      },
    ],
  },
  {
    id: "reel-besan-ladoo",
    projectId: "6ae626b3333adce4e02df89d",
    title: "The Magic Science of Besan Ladoo",
    topic: "Chemistry & Physics of Roasting Besan Ladoo",
    videoUrl: "/videos/6ae626b3333adce4e02df89d.mp4",
    creator: {
      name: "Science Rasoi",
      username: "science.foodlab",
      avatar: "🍲",
      verified: true,
    },
    likes: 5120,
    isLiked: false,
    commentsCount: 318,
    sharesCount: 1420,
    voiceName: "Swara (Hinglish 🇮🇳)",
    duration: 64,
    caption:
      "Besan ladoo ka delicious aroma Maillard Reaction aur Ghee crystallization ki wajah se hota hai! Dekhiye deep molecular food science in pure Hinglish ✨🥘 #foodscience #maillardreaction #besanladoo #cooking #chemistry #reels",
    tags: ["Science", "Chemistry", "Food Science", "Hinglish"],
    scenes: [
      {
        sequence: 1,
        title: "Golden Aroma Hook",
        narration:
          "Besan bhunte waqt jo mesmerising smell aati hai, uske peeche kya science hai?",
        visualLabel: "Simmering Kadai Reaction",
      },
      {
        sequence: 2,
        title: "The Maillard Reaction",
        narration:
          "Low flame par amino acids aur sugars react karte hain, jise Maillard reaction kehte hain. Yahi golden color deta hai.",
        visualLabel: "Molecular Heat Transform",
      },
      {
        sequence: 3,
        title: "Ghee Lipid Matrix",
        narration:
          "Desi ghee besan particles ko coat karta hai taaki cooling ke dauran uniform crystal network bane.",
        visualLabel: "Lipid Binding Diagram",
      },
      {
        sequence: 4,
        title: "Sugar Timing Secret",
        narration:
          "Bura ya sugar tabhi milayein jab mixture lukewarm ho, warna moisture se ladoo soggy ho jayenge!",
        visualLabel: "Temperature Curve",
      },
      {
        sequence: 5,
        title: "Perfect Texture Mastery",
        narration:
          "Science aur patience milkar banate hain melt-in-the-mouth besan ladoos!",
        visualLabel: "Crystalline Final Sweet",
      },
    ],
  },
  {
    id: "reel-binary-search",
    projectId: "test_binary_search_remotion",
    title: "How Binary Search Cuts Time in Half",
    topic: "Binary Search Algorithm in O(log n)",
    videoUrl: "/videos/test_binary_search_remotion.mp4",
    creator: {
      name: "AlgoNinja",
      username: "algoninja.dsa",
      avatar: "🌳",
      verified: true,
    },
    likes: 8940,
    isLiked: true,
    commentsCount: 520,
    sharesCount: 2350,
    voiceName: "Christopher (English 🇺🇸)",
    duration: 48,
    caption:
      "Why search 1 million items sequentially when Binary Search can find any element in just 20 comparisons? Visualizing O(log n) efficiency step by step! 💻🎯 #algorithms #binarysearch #dsa #softwareengineering #leetcode",
    tags: ["Code", "DSA", "Algorithms", "English"],
    scenes: [
      {
        sequence: 1,
        title: "The Linear Search Problem",
        narration:
          "Looking for a number in a sorted array one by one takes O(N) operations in the worst case.",
        visualLabel: "Sorted Array Visualization",
      },
      {
        sequence: 2,
        title: "Inspect the Midpoint",
        narration:
          "Binary Search checks the middle element immediately and halves the search space every single step.",
        visualLabel: "Midpoint Pivot",
      },
      {
        sequence: 3,
        title: "Exponential Elimination",
        narration:
          "If target is larger, throw away the entire left half. In just 20 steps, you search 1,000,000 items!",
        visualLabel: "Logarithmic Tree Graph",
      },
      {
        sequence: 4,
        title: "Key Takeaway",
        narration:
          "That is why logarithmic O(log n) algorithms scale effortlessly to billions of database queries.",
        visualLabel: "Efficiency Benchmark",
      },
    ],
  },
  {
    id: "reel-airplane-wings",
    projectId: "test_airplane_flight_remotion",
    title: "Why Airplane Wings Have Curved Tips",
    topic: "Aerodynamics: Winglets and Induced Drag",
    videoUrl: "/videos/test_airplane_flight_remotion.mp4",
    creator: {
      name: "AeroPhysics",
      username: "aero.explained",
      avatar: "✈️",
      verified: true,
    },
    likes: 4210,
    isLiked: false,
    commentsCount: 204,
    sharesCount: 1100,
    voiceName: "Jenny (English 🇺🇸)",
    duration: 52,
    caption:
      "Ever noticed those upward bends at the end of commercial jet wings? They are called Winglets, and here is how they save billions of gallons of fuel! ✈️💨 #aviation #physics #aerodynamics #engineering #science",
    tags: ["Physics", "Aviation", "Science", "English"],
    scenes: [
      {
        sequence: 1,
        title: "High Pressure Meets Low Pressure",
        narration:
          "Wings generate lift because air travels faster over the curved top, creating low pressure above and high pressure below.",
        visualLabel: "Airfoil Cross-Section",
      },
      {
        sequence: 2,
        title: "Dangerous Wingtip Vortices",
        narration:
          "At the wingtip, high-pressure air leaks upward, swirling into powerful tornadoes called wingtip vortices.",
        visualLabel: "Vortex Airflow Spiral",
      },
      {
        sequence: 3,
        title: "The Winglet Solution",
        narration:
          "Adding vertical winglets blocks the vortex spillover, slashing induced drag by over 5 percent across the globe.",
        visualLabel: "Smooth Streamlines with Winglet",
      },
    ],
  },
  {
    id: "reel-leetcode-puzzle",
    projectId: "6ae6164d333adce4e02df893",
    title: "Cracking LeetCode Like a Puzzle",
    topic: "Mental Models for Coding Interviews",
    videoUrl: "/videos/6ae6164d333adce4e02df893.mp4",
    creator: {
      name: "Divya Code",
      username: "divya.dev",
      avatar: "🚀",
      verified: true,
    },
    likes: 6720,
    isLiked: false,
    commentsCount: 410,
    sharesCount: 1890,
    voiceName: "Madhur (Hinglish 🇮🇳)",
    duration: 56,
    caption:
      "LeetCode problems memorize mat karo! 14 standard algorithmic patterns samajh lo aur har interview solve ho jayega 🧠🔥 #leetcode #coding #interview #faang #hinglish #softwaredeveloper",
    tags: ["Coding", "Interview Prep", "DSA", "Hinglish"],
    scenes: [
      {
        sequence: 1,
        title: "The Problem with Rote Learning",
        narration:
          "500 LeetCode problems yaad karne ki galti mat karna. Patterns pe focus karo!",
        visualLabel: "Patterns over Problems",
      },
      {
        sequence: 2,
        title: "Two Pointers & Sliding Window",
        narration:
          "Sorted arrays mein Two Pointers aur contiguous subarrays mein Sliding Window 80 percent questions crack kar deta hai.",
        visualLabel: "Sliding Window Animation",
      },
      {
        sequence: 3,
        title: "Mastering the Mindset",
        narration:
          "Pattern identify karo, edge cases dry-run karo, aur time complexity O(n) ya O(log n) optimize karo.",
        visualLabel: "Mastery Flowchart",
      },
    ],
  },
];
