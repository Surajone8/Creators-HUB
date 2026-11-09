export const YOUTUBE_LIMITS = {
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 5000,
  TAGS_MAX_COUNT: 500, // total character length in comma-delimited string
  MAX_FILE_SIZE_BYTES: 128 * 1024 * 1024 * 1024, // 128GB or 12 hours
} as const;

export const YOUTUBE_CATEGORIES = [
  { id: "1", name: "Film & Animation" },
  { id: "2", name: "Autos & Vehicles" },
  { id: "10", name: "Music" },
  { id: "15", name: "Pets & Animals" },
  { id: "17", name: "Sports" },
  { id: "20", name: "Gaming" },
  { id: "22", name: "People & Blogs" },
  { id: "23", name: "Comedy" },
  { id: "24", name: "Entertainment" },
  { id: "25", name: "News & Politics" },
  { id: "26", name: "Howto & Style" },
  { id: "27", name: "Education" },
  { id: "28", name: "Science & Technology" },
] as const;

export const YOUTUBE_PRIVACY_OPTIONS = [
  { value: "private", label: "Private (Only you can view)" },
  { value: "unlisted", label: "Unlisted (Anyone with link can view)" },
  { value: "public", label: "Public (Everyone can search & view)" },
] as const;
