import { UserProfile, Post } from '../types';

export const MOCK_USER: UserProfile = {
  id: "u1",
  name: "Alex Rivers",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrqBPoinZYAiFkTo1G3R7ud82T5VLFv9us6nbpVt1tozpkyqWUr4mXy8fnaPlQitCJA7_YISxXReKL0rk-6wRWR4CNx40S2KD899zzbSAsx7XXACKOuBY89WD0DRbqMxMpoL806dknIIyCZbCHNuUcL4vcsx6clM5DtFEPWFHamOTE6L_kBqgjP1TuXioHPmzO5Lwcw-1mpMZ2fPJ3oaJR0hheuH-yiFIRdrfWB7N91ALT3IeIPaQpZ9VYIm8nnvS3ZqmNDI6WMoNR",
  cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuA8UKVDZdM2AnKRXXyraFnR5cShhBYGaVCBO3iqWvaXZH0_JqTdY52Ms-iWs6aDdfLIZoQNOXRFoP3-yCm2WRhicNlRDjljtdJ8ruYbqlKKt6LWICEoWQecygjMi9S7i95xQZGh0HSXklrs-JlsuyNUUYGpUP4KGIKzEC_XMS5GiuvQyF1gJs_CNizLMenU3YBPHh1Wo1QeMMy78_E6dgCLRtLk-cl6kMkDTCu-QNBlPcKLRnry8ILyvt0g9ayuI-8UzSsRLvDyoYcR",
  bio: "Digital Artist & Creative Strategist. Exploring the intersection of human connection and digital ecosystems. 🎨✨",
  following: "1.2k",
  followers: "4.8k",
  posts: "342",
  role: "Premium Member"
};

export const MOCK_USERS: UserProfile[] = [
  MOCK_USER,
  {
    id: "u2",
    name: "Sarah Miller",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxXdOWCb8XorSt5V-MlAZxbCjBs2Yua9rJ9uUJ9cbspwZFiOEUypu1a_sdO7g1PptcyA6Y4JkSnPpHE1KfvD5crhGFKO_I5QxD9bbMtGHuieKKM_eGlVgHC8f9BvColwSKeyKezgfIjz4MplV-XtLQskL3e56hxZ285VGgPT8BH2Unry8vU3GKMJTBIprVbTEi80Ia78I4PyRE6WlOT2rrH_AcDiqWtcgJEPVdDUm0NBBsXR0BgEFa4-y6n8R1a8cyoNTyhDh5nJC6",
    cover: "https://picsum.photos/seed/sarah/1200/400",
    bio: "Creative Director & Brand Strategist. Passionate about minimal design and storytelling.",
    following: "842",
    followers: "12.4k",
    posts: "156",
    role: "Verified Artist",
    isFollowing: false
  },
  {
    id: "u3",
    name: "Marcus Wright",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMVk0sa-PsPFpyZRwefgtYJ6kUqqir6dA17YrLHhFDud5Gw5eGMt_uPYque2UHvuwF-HDo2-MssfV5U0JQa0PnyuKZ6LlHKFZygCUWOOgl44f0XLlWKrVo4g7Md97Ecx04HHrDoCnBoA9stsCOOGImXLHMrPd9cxDP9Wj3u2HFwneSVISOdOtxbi_xkPxni8J4j5Y3O-Aj9mkqCouF5U55UjKVxQhOI1kTeXP5768SGE6h33rYCrvAq6ij2XWSx04xltNYpo2pcNTb",
    cover: "https://picsum.photos/seed/marcus/1200/400",
    bio: "Urban Photographer capturing the soul of the city. 🏙️📸",
    following: "2.1k",
    followers: "5.6k",
    posts: "892",
    role: "Professional",
    isFollowing: true
  }
];

export const getUserById = (id: string) => MOCK_USERS.find(u => u.id === id) || MOCK_USER;

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: {
      id: 'u2',
      name: "Sarah Miller",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxXdOWCb8XorSt5V-MlAZxbCjBs2Yua9rJ9uUJ9cbspwZFiOEUypu1a_sdO7g1PptcyA6Y4JkSnPpHE1KfvD5crhGFKO_I5QxD9bbMtGHuieKKM_eGlVgHC8f9BvColwSKeyKezgfIjz4MplV-XtLQskL3e56hxZ285VGgPT8BH2Unry8vU3GKMJTBIprVbTEi80Ia78I4PyRE6WlOT2rrH_AcDiqWtcgJEPVdDUm0NBBsXR0BgEFa4-y6n8R1a8cyoNTyhDh5nJC6"
    },
    time: "2 hours ago",
    content: "Just finished designing the new brand identity for our boutique workshop. The balance between editorial authority and digital fluidity is exactly what we were aiming for. 🎨✨",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDClznMKXktKPRSWnJH5bSPff-jUBIsmjn2RJ10Hfrwp2PjG2fXW9FuL3ZQJZlvUzd_z3Vt1NcsgZSyBoohV4HVJiU2YtQvvEggwW---0LJOq84PhIRhc1FmrnNOSSAdSs8rWtiutZQKQXbM1inaqIhfjXbH_tUwN5pGmxIe1tsR5TSdF5qXUgMtIWMLiCDMqdJEQ7akN9R9EuyR46k04fGSDFx2PwFyBlVm2xnuCiC_xROJPyjhRTXqogZmTqaXmDx4jmNCqPh4z5j",
    reactions: 142,
    comments: 24,
    shares: 8
  },
  {
    id: '2',
    author: {
      id: 'u3',
      name: "Marcus Wright",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMVk0sa-PsPFpyZRwefgtYJ6kUqqir6dA17YrLHhFDud5Gw5eGMt_uPYque2UHvuwF-HDo2-MssfV5U0JQa0PnyuKZ6LlHKFZygCUWOOgl44f0XLlWKrVo4g7Md97Ecx04HHrDoCnBoA9stsCOOGImXLHMrPd9cxDP9Wj3u2HFwneSVISOdOtxbi_xkPxni8J4j5Y3O-Aj9mkqCouF5U55UjKVxQhOI1kTeXP5768SGE6h33rYCrvAq6ij2XWSx04xltNYpo2pcNTb"
    },
    time: "5 hours ago",
    content: "Morning vibes in the city. There's something magical about how the light hits the architecture at 7 AM. 🏙️",
    reactions: 24,
    comments: 4,
    shares: 2
  },
  {
    id: '3',
    author: {
      id: 'u1',
      name: "Alex Rivers",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrqBPoinZYAiFkTo1G3R7ud82T5VLFv9us6nbpVt1tozpkyqWUr4mXy8fnaPlQitCJA7_YISxXReKL0rk-6wRWR4CNx40S2KD899zzbSAsx7XXACKOuBY89WD0DRbqMxMpoL806dknIIyCZbCHNuUcL4vcsx6clM5DtFEPWFHamOTE6L_kBqgjP1TuXioHPmzO5Lwcw-1mpMZ2fPJ3oaJR0hheuH-yiFIRdrfWB7N91ALT3IeIPaQpZ9VYIm8nnvS3ZqmNDI6WMoNR"
    },
    time: "1 day ago",
    content: "Working on some new digital sculptures today. The way we can manipulate form in virtual space is just mind-blowing. Can't wait to share more! 🧊✨",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA8UKVDZdM2AnKRXXyraFnR5cShhBYGaVCBO3iqWvaXZH0_JqTdY52Ms-iWs6aDdfLIZoQNOXRFoP3-yCm2WRhicNlRDjljtdJ8ruYbqlKKt6LWICEoWQecygjMi9S7i95xQZGh0HSXklrs-JlsuyNUUYGpUP4KGIKzEC_XMS5GiuvQyF1gJs_CNizLMenU3YBPHh1Wo1QeMMy78_E6dgCLRtLk-cl6kMkDTCu-QNBlPcKLRnry8ILyvt0g9ayuI-8UzSsRLvDyoYcR",
    reactions: 89,
    comments: 12,
    shares: 5
  }
];
