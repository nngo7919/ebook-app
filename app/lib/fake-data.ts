// ============================================================
// FAKE DATA — dùng để test UI khi chưa có Supabase
// Xóa file này hoặc không import nữa khi backend sẵn sàng
// ============================================================

import type { Book, Chapter, UserLibraryItem } from "./types";

const BOOK_DEFAULTS = {
	author_id: null,
	rating_avg: 0,
	rating_count: 0,
	comment_count: 0,
	is_deleted: false,
	deleted_at: null,
} as const;

// ── BOOKS ────────────────────────────────────────────────────

export const FAKE_BOOKS: Book[] = [
	{
		...BOOK_DEFAULTS,
		id: "1",
		title: "Khủng Bố Sống Lại",
		author: "Phát Tiểu Tiểu Tiêu",
		cover_url: null,
		description: "Dương Gian trọng sinh vào thế giới hậu tận thế, nơi zombie và quái vật tràn ngập. Với ký ức của kiếp trước, hắn quyết tâm sống sót.",
		tag: "novel",
		genres: "Kinh Dị, Hành Động, Mạt Thế, Dị Năng",
		genres_list: ["Kinh Dị", "Hành Động", "Mạt Thế", "Dị Năng"],
		total_chapters: 1606,
		is_full: true,
		views: 98000,
		likes: 4320,
		editor: null,
		created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
		updated_at: new Date().toISOString(),
	},
	{
		...BOOK_DEFAULTS,
		id: "2",
		title: "Trọng Sinh Trong Sách Pháo Hôi Học Tra Người Qua Đường Giáp",
		author: "tntytn",
		cover_url: null,
		description: "Trọng sinh vào cuốn sách ngôn tình mình từng đọc, trở thành nhân vật phụ vô danh. Số phận éo le khiến hắn liên tục dính líu đến plot chính.",
		tag: "novel",
		genres: "Ngôn Tình, Hiện Đại, HE, Xuyên Thư, Vườn Trường, NP, Hài Hước",
		genres_list: ["Ngôn Tình", "Hiện Đại", "HE", "Xuyên Thư", "Vườn Trường", "NP", "Hài Hước"],
		total_chapters: 17,
		is_full: false,
		views: 101,
		likes: 57,
		editor: "tntytn",
		created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
		updated_at: new Date().toISOString(),
	},
	{
		...BOOK_DEFAULTS,
		id: "3",
		title: "Xuyên Thành Nông Nữ, Được Cả Nhà Cưng",
		author: "Viện Kinh Phong",
		cover_url: null,
		description: "Xuyên vào thân phận nông nữ nghèo khổ nhưng lại được cả gia đình yêu thương. Cuộc sống điền viên bình yên và mối tình ngọt ngào.",
		tag: "novel",
		genres: "Ngôn Tình, Cổ Đại, Điền Văn, Xuyên Không, Sủng",
		genres_list: ["Ngôn Tình", "Cổ Đại", "Điền Văn", "Xuyên Không", "Sủng"],
		total_chapters: 270,
		is_full: true,
		views: 54000,
		likes: 2110,
		editor: null,
		created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
		updated_at: new Date().toISOString(),
	},
	{
		...BOOK_DEFAULTS,
		id: "4",
		title: "Dọn Sạch Cả Nhà, Ta Xuống Nông Thôn",
		author: "Nguyệt Dạ Hồng Liên",
		cover_url: null,
		description: "Sau khi bị phản bội, cô dọn sạch tài sản rồi về quê sinh sống. Ai ngờ cuộc đời mới lại mở ra đầy bất ngờ.",
		tag: "novel",
		genres: "Ngôn Tình, Xuyên Thư, Niên Đại, Sảng Văn",
		genres_list: ["Ngôn Tình", "Xuyên Thư", "Niên Đại", "Sảng Văn"],
		total_chapters: 374,
		is_full: true,
		views: 72000,
		likes: 3180,
		editor: null,
		created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
		updated_at: new Date().toISOString(),
	},
	{
		...BOOK_DEFAULTS,
		id: "5",
		title: "Sau Khi Bắt Được Chồng Quân Nhân",
		author: "Đại Nguyên Từ Nha",
		cover_url: null,
		description: "Vô tình cứu một anh lính, không ngờ anh ta lại không chịu buông tha. Một cuộc hôn nhân đầy sóng gió nhưng ngọt ngào.",
		tag: "novel",
		genres: "Ngôn Tình, Đô Thị, Niên Đại, Convert",
		genres_list: ["Ngôn Tình", "Đô Thị", "Niên Đại", "Convert"],
		total_chapters: 292,
		is_full: true,
		views: 61000,
		likes: 2740,
		editor: null,
		created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
		updated_at: new Date().toISOString(),
	},
	{
		...BOOK_DEFAULTS,
		id: "6",
		title: "Nhung Đen - Nha Nha Cật Tố Dã Cật N...",
		author: "Nha Nha Cật Tố",
		cover_url: null,
		description: "Câu chuyện về tình yêu đan xen giữa bóng tối và ánh sáng.",
		tag: "novel",
		genres: "Đô Thị, Đam Mỹ, Hiện Đại, 1v1, HE",
		genres_list: ["Đô Thị", "Đam Mỹ", "Hiện Đại", "1v1", "HE"],
		total_chapters: 39,
		is_full: true,
		views: 8800,
		likes: 412,
		editor: null,
		created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
		updated_at: new Date().toISOString(),
	},
	{
		...BOOK_DEFAULTS,
		id: "7",
		title: "Đóa Hoa Lạnh Lùng Nhà Bên Yêu Tôi",
		author: "Hằng Nha Nha",
		cover_url: null,
		description: "Hàng xóm lạnh lùng bỗng một ngày tỏ tình. Bên trong lớp vỏ băng giá là trái tim ấm áp nhất.",
		tag: "novel",
		genres: "Ngôn Tình, Hiện Đại, Sủng, HE",
		genres_list: ["Ngôn Tình", "Hiện Đại", "Sủng", "HE"],
		total_chapters: 128,
		is_full: true,
		views: 43000,
		likes: 1890,
		editor: null,
		created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
		updated_at: new Date().toISOString(),
	},
	{
		...BOOK_DEFAULTS,
		id: "8",
		title: "Tiên Nghịch",
		author: "Nhĩ Căn",
		cover_url: null,
		description: "Tu tiên nghịch thiên, phá vạn pháp. Hành trình của một thiếu niên từ bình thường trở thành đỉnh cao cõi tiên.",
		tag: "novel",
		genres: "Tiên Hiệp, Huyền Huyễn, Nam Chủ, Tu Tiên",
		genres_list: ["Tiên Hiệp", "Huyền Huyễn", "Nam Chủ", "Tu Tiên"],
		total_chapters: 2376,
		is_full: true,
		views: 187000,
		likes: 9200,
		editor: null,
		created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
		updated_at: new Date().toISOString(),
	},
];

// ── CHAPTERS ─────────────────────────────────────────────────

const CHAPTER_TITLES = [
	"Trong diễn đàn Quỷ Cố Sự",
	"Bài giảng đột xuất",
	"Quỷ vực",
	"Con quỷ gõ cửa kinh hoàng",
	"Lạc đường",
	"Bàn tay trong nhà vệ sinh",
	"Sau lưng bước chân",
	"Cây kỳ lạ",
	"Quỷ Anh",
	"Sức mạnh của Ác Quỷ",
	"Dần Dần Thức Tỉnh",
	"Khác nào trí chướng",
	"Giấy bằng da dê",
	"Tấm giấy quỷ dị",
	"Nghi lễ cổ xưa",
	"Bí mật của làng",
	"Đêm không ngủ",
];

const FAKE_CONTENT = `Lão phu bấm ngón tay tính toán, hiện giờ người đang nằm trên giường xem tiểu thuyết, lại còn nằm nghiêng, có khi điện thoại còn đang sạc pin.

Dương Gian, cậu học sinh lớp 12, lúc này đang nằm trong chăn, buồn chán lướt điện thoại. Hắn tiện tay mở một bài viết, bên dưới có rất nhiều bình luận của cư dân mạng.

"Thánh thật sự, chủ thớt đoán trúng phóc luôn."

"Mọi người biết tôi đang đi vệ sinh không?"

Dương Gian lắc đầu cười, tiếp tục cuộn xuống đọc thêm. Bên ngoài cửa sổ, tiếng gió thổi xào xạc qua những tán lá xanh.

Đột nhiên điện thoại rung lên, một tin nhắn lạ xuất hiện không rõ người gửi.

"Cậu có muốn biết bí mật của căn nhà số 7 không?"

Dương Gian nhíu mày, định bỏ qua thì lại có tin nhắn tiếp theo gửi đến, lần này kèm theo một tấm ảnh. Trong ảnh là cửa sổ phòng hắn, chụp từ bên ngoài.

Tim hắn đập mạnh hơn. Phòng hắn ở tầng 5.

Hắn từ từ quay đầu nhìn ra cửa sổ, màn đêm tối đen nhưng hắn có cảm giác rõ ràng — có gì đó đang nhìn lại mình.

Điện thoại rung thêm lần nữa.

"Đừng quay lại."`;

export function makeFakeChapters(bookId: string, count = 33): Chapter[] {
	return Array.from({ length: count }, (_, i) => ({
		id: `fake-ch-${bookId}-${i + 1}`,
		book_id: bookId,
		chapter_number: i + 1,
		title:
			i < CHAPTER_TITLES.length
				? `Chương ${i + 1}: ${CHAPTER_TITLES[i]}`
				: `Chương ${i + 1}`,
		content: FAKE_CONTENT,
		word_count: 1200,
		is_deleted: false,
		deleted_at: null,
		created_at: new Date(Date.now() - i * 2 * 86400000).toISOString(),
		updated_at: new Date().toISOString(),
	}));
}

// ── MY LIBRARY ───────────────────────────────────────────────

export const FAKE_MY_BOOKS = FAKE_BOOKS.slice(0, 5).map((b, i) => ({
	id: `lib-${b.id}`,
	title: b.title,
	author: b.author,
	tag: b.tag,
	source: "download" as const,
	book_id: b.id,
	cover_url: b.cover_url ?? undefined,
	current_chapter: i + 1,
	total_chapters: b.total_chapters,
}));

export const FAKE_LIBRARY_ITEMS: UserLibraryItem[] = FAKE_BOOKS.slice(0, 3).map((b) => ({
	id: `dl-${b.id}`,
	user_id: "fake-user",
	book_id: b.id,
	title: b.title,
	author_id: null,
	author: b.author,
	tag: b.tag,
	cover_url: b.cover_url,
	source: "download" as const,
	file_path: null,
	created_at: new Date().toISOString(),
	current_chapter: 1,
}));


// ── SORTED LISTS (dùng cho category screen) ──────────────────

/** Sort theo rating (giả lập = likes / views * 5) */
export const FAKE_BOOKS_BY_RATING = [...FAKE_BOOKS]
	.map((b) => ({ ...b, _rating: parseFloat(((b.likes / (b.views || 1)) * 5 * 10).toFixed(1)) }))
	.sort((a, b) => b._rating - a._rating);

/** Sort theo lượt thích */
export const FAKE_BOOKS_BY_LIKES = [...FAKE_BOOKS]
	.sort((a, b) => b.likes - a.likes);

/** Sort theo lượt xem */
export const FAKE_BOOKS_BY_VIEWS = [...FAKE_BOOKS]
	.sort((a, b) => b.views - a.views);

/** Thịnh hành = xem nhiều nhất (trending) */
export const FAKE_BOOKS_TRENDING = [...FAKE_BOOKS]
	.sort((a, b) => b.views - a.views);

/** Truyện full */
export const FAKE_BOOKS_FULL = FAKE_BOOKS.filter((b) => b.is_full);

/** Full + sort theo ngày cập nhật */
export const FAKE_BOOKS_FULL_UPDATED = [...FAKE_BOOKS_FULL]
	.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

/** Full + đánh giá cao */
export const FAKE_BOOKS_FULL_RATING = [...FAKE_BOOKS_FULL]
	.sort((a, b) => (b.likes / (b.views || 1)) - (a.likes / (a.views || 1)));

/** Full + yêu thích nhiều */
export const FAKE_BOOKS_FULL_LIKED = [...FAKE_BOOKS_FULL]
	.sort((a, b) => b.likes - a.likes);

/** Full + xem nhiều */
export const FAKE_BOOKS_FULL_VIEWS = [...FAKE_BOOKS_FULL]
	.sort((a, b) => b.views - a.views);

/** Map title → fake list — dùng trong category.tsx */
export const FAKE_CATEGORY_MAP: Record<string, typeof FAKE_BOOKS> = {
	// Quick filters
	"Đánh Giá": FAKE_BOOKS_BY_RATING,
	"Yêu Thích": FAKE_BOOKS_BY_LIKES,
	"Xem Nhiều": FAKE_BOOKS_BY_VIEWS,
	// Xem thêm từ library
	"Mới Đăng": FAKE_BOOKS,
	"Mới Cập Nhật": FAKE_BOOKS,
	// Full categories
	"Full – Mới Cập Nhật": FAKE_BOOKS_FULL_UPDATED,
	"Full – Đánh Giá Cao": FAKE_BOOKS_FULL_RATING,
	"Full – Yêu Thích": FAKE_BOOKS_FULL_LIKED,
	"Full – Xem Nhiều": FAKE_BOOKS_FULL_VIEWS,
};
