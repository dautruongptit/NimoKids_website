/** Interface texts (not game content: questions and answers come from the backend). {name} is replaced by t(key, { name }). */
export type UiLang = 'en' | 'vi';

const en = {
  home: 'Play', adventures: 'Adventures', safeTag: 'Toddler Safe', sound: 'Sound', on: 'ON', off: 'OFF',
  soundOnLabel: 'Turn sound on', soundOffLabel: 'Turn sound off', homeLabel: 'NimoKids home', mascotAlt: 'NimoKids mascot', mainNav: 'Main navigation',
  stepAge: 'Choose Age', stepTopic: 'Choose Topic', stepPlay: 'Play', stepCelebrate: 'Celebrate', stepLabel: 'Step {n} of 4',

  homePill: '✨ A happy little place to learn', homeTitle1: 'Little discoveries.', homeTitle2: 'Big happy smiles.',
  homeText: 'Look, listen, and play your way into a world of wonder.\nA little adventure made just for your little one.',
  homeCta: "Let's Play! 🚀", homeAges: 'For curious little minds, ages 1–5', featLook: '👀 Look', featTap: '👆 Tap', featCelebrate: '🌟 Celebrate',
  homePhotoAlt: 'A friendly plush bear ready for a learning adventure', photoNote: 'Your next adventure starts here! ✨', floatPill: '💛 Little steps. Big wonder.',
  hintTitle: 'No pressure, just exploration!', hintText: 'No accounts. No complicated steps. Just a little learning and a lot of fun.',
  sayLetsPlay: "Let's play! Choose your age.", sayChooseTopic: 'Choose a topic!',

  ageTitle: 'Choose Your Age 🎈', ageSubtitle: 'Tap your age to begin a happy learning adventure!', years: 'YEARS', chooseYears: 'Choose {age} Years',
  ageYoungTitle: 'First little discoveries 🍼', ageYoungText: 'Big bright pictures, gentle sounds, and simple discoveries for little learners.',
  ageYoungPills: '🖼️ Big bright pictures|🎵 Gentle sounds|✨ Easy little questions',
  ageOldTitle: 'Curious little explorers 🎒', ageOldText: 'Growing curious minds with letters, numbers, and a colorful world of wonder.',
  ageOldPills: '💡 Curious thinking|🔢 Numbers & letters|🌍 Explore the world',
  ageYoungAlt: 'A cuddly kitten in a cozy playroom', ageOldAlt: 'A curious plush bear with a little backpack',
  ageHintTitle: 'One tap, and on to Choose Topic! ✨', ageHintText: 'Pick the little card that fits your child. Their next adventure is just a tap away.',

  back: 'Back', topicStep: 'Step 2 of 4: Choose Topic', topicTitle: 'Choose a Topic! 🎯',
  topicText: "What do you want to learn today?\nTap a squishy card and let's explore!", preschoolPill: 'Preschool Safe •\n100% Fun',
  sayTopicGuide: 'Choose a topic! What do you want to learn today?', listenGuide: 'Listen to topic guide',
  fiveQuestions: '5 Questions', surprise: 'Surprise me!', allTopics: 'All Topics', allTopicsText: 'Little surprises from all our friendly worlds!',
  saySurprise: 'All topics! Surprise me!', hear: 'Hear {name}', selected: 'Selected', selectedTopic: 'Selected Topic:',
  moreWorlds: 'More little worlds ↓', fewerWorlds: 'Fewer little worlds ↑', topicHintTitle: 'No pressure, just exploration!',
  topicHintText: "Every answer is a new discovery. Let's see what we can learn!", ageReminder: 'Made for your {age}-year-old explorer',
  letsPlay: "Let's Play! 🚀", gettingReady: 'Getting ready… ✨', tapToHear: 'Listen again', logoTagline: 'PLAY & LEARN', scoreLabel: 'Correct answers', allTopicsTitle: 'All Topics', surpriseHint: 'Surprise me!', favouriteBadge: 'Loved by kids the most!', surpriseDesc: 'A surprise spin! Random mix of animals, colors and fruits, no thinking needed!', playSurprise: 'Play a Surprise Now!', orPickOne: 'Or pick one kids like:', wonderTopics: '{n} wonderful topics', loadingQuestions: 'Nimo is picking your questions…', loadingSlow: 'The internet is a little slow. Nimo is still trying…',
  topicsLoading: 'Finding happy little worlds…', errTitle: "Oops! Let's try again",
  errOffline: 'The little worlds are a bit shy right now. Check the internet and try again.',
  errServer: 'Something went wrong on our side. Please try again in a moment.', tryAgain: 'Try again 🔄',
  startNotReady: "This little world isn't ready to play yet. Please pick another one!", startLost: "That round ended early. Let's start a new one!",
  startOffline: 'We could not reach the little worlds. Check the internet and try again.',

  tinyLabel: 'LOOK, LISTEN & DISCOVER', question: 'Question {n}/{total}', questionAria: 'Question {n} of {total}', seconds: 'seconds',
  secondsAria: '{n} seconds remaining', pictureAlt: 'Look at this picture', tapAnswer: 'Tap your answer ↓', tapAgain: 'Oops! Tap again 💛',
  fbCorrect: 'Great! 🎉', fbWrong: 'Try again! 💛', fbTimeout: "Time's up! ⏰",
  quizHintCorrect: "You're a little superstar!", quizHintAnswered: 'Every try helps your little mind grow.', quizHintIdle: 'Take a peek. You can do it!',
  quizHint2Answered: 'Another little discovery is on the way…', quizHint2Idle: 'Your next question comes along all by itself.',

  resultPill: '✨ A little adventure. A big high five!', trophy: 'Golden trophy', greatJob: 'Great Job! 🎉', resultText: 'You explored, you tried, and you learned something new!',
  starsLabel: '{n} stars', accuracy: '🎯 Accuracy', bestStreak: '🔥 Best streak', currentStreak: '⭐ Current streak', playAgain: 'Play Again! 🚀',
  homeButton: '⌂ Home', share: '↗ Share', replayNote: 'More {topic} fun • Ages {age}', copied: 'Celebration copied! 💛',
  shareText: 'A little NimoKids celebration! {score}/{total} discoveries in {topic}. 🌟', shareTitle: 'NimoKids • Great Job!',

  footerTitle: 'Safe Digital Playroom for Toddlers', footerText: 'No ads, gentle guidance, and endless little smiles',
  footerAges: '💛 Ages 1–5 • No accounts required', footerMade: 'Made with love for little hands.', footerPlay: 'Play', footerParents: 'For parents', footerLinkHome: 'Home', footerLinkAge: 'Choose age', footerLinkTopics: 'All topics', footerFact1: 'Playing needs no account', footerFact2: 'Optional Google sign-in, for parents only', footerFact3: 'No ads, no links out of the game', footerFact4: 'Vietnamese, or Vietnamese with English words', footerBrandText: 'Short picture quizzes for little learners: look, listen and tap.',

  authSignIn: 'Sign in', authSignInAria: 'Sign in, optional', authChecking: 'Signing in…', authMenuAria: 'Account of {name}',
  authKicker: 'FOR GROWN-UPS • ALWAYS OPTIONAL', authKickerCorner: 'YOUR LITTLE NIMOKIDS CORNER', authClose: 'Close',
  authIntroTitle: 'Save Your Progress! 🌟', authIntroText: 'Sign in to keep your progress, achievements, and game history.',
  authBenefits: '🌟 Little achievements|📖 Happy game memories|💛 Pick up where you left off',
  authLoadingTitle: 'Signing you in…', authLoadingText: 'Just a little moment. Your next adventure is waiting.',
  authCancelledTitle: 'No worries, keep playing! 💛', authCancelledText: 'Sign-in was cancelled. Your next adventure is still waiting.',
  authErrorTitle: 'Something went wrong.', authErrorText: 'That’s okay! Try again, or keep playing without signing in.',
  authDisabledTitle: 'This account is not available', authDisabledText: 'Please contact us if you think this is a mistake. You can keep playing without signing in.',
  authUnavailableText: 'Sign-in is not available right now. You can keep playing!',
  authContinueGoogle: 'Continue with Google', authTryAgainGoogle: 'Try Again with Google', authSkip: 'Continue without signing in',
  authCancelKeep: 'Cancel and keep playing', authReassure: 'No account needed to play. Not now. Not ever. 💛',
  authReassureIn: 'You can always play with or without an account.', authHi: 'Hi, {name}! 👋', authFriend: 'friend',
  authProfileTitle: 'Your little playroom', authProfileText: 'Your account and the devices you are signed in on.',
  authMyAccount: 'My account', authSignOut: 'Sign out', authPlayOpen: 'Play is always open to everyone. 💛',
  authBack: 'Back to playing! 🚀', authDevices: 'Your devices', authThisDevice: 'This device', authSignOutDevice: 'Sign out',
  authSignOutAll: 'Sign out everywhere', authNoDevices: 'No other devices.', authDevicesError: 'Could not load your devices. Try again later.',
  authSeen: 'Last used {when}', authToastOut: 'Signed out. Let’s keep playing!', authToastEnded: 'You were signed out. You can keep playing and sign in again any time.',
  authToastAll: 'Signed out on all devices.', authSavePromptTitle: 'Keep your little discoveries', authSavePromptText: 'Want to save your progress? Signing in is optional.',
  authMaybeLater: 'Maybe later', authDismiss: 'Dismiss sign-in suggestion', authSigningInPage: 'Signing you in…',

  langLabel: 'Language', langVi: 'Học tiếng Việt', langViEn: 'Học tiếng Anh', langViHint: 'Full Vietnamese', langViEnHint: 'Vietnamese questions, English answers', recommended: 'Recommended',
};

export type UiKey = keyof typeof en;

const vi: Record<UiKey, string> = {
  home: 'Chơi', adventures: 'Khám phá', safeTag: 'An toàn cho bé', sound: 'Âm thanh', on: 'BẬT', off: 'TẮT',
  soundOnLabel: 'Bật âm thanh', soundOffLabel: 'Tắt âm thanh', homeLabel: 'Trang chủ NimoKids', mascotAlt: 'Linh vật NimoKids', mainNav: 'Điều hướng chính',
  stepAge: 'Chọn tuổi', stepTopic: 'Chọn chủ đề', stepPlay: 'Chơi', stepCelebrate: 'Chúc mừng', stepLabel: 'Bước {n} trên 4',

  homePill: '✨ Một góc nhỏ vui vẻ để học', homeTitle1: 'Khám phá nho nhỏ.', homeTitle2: 'Nụ cười thật to.',
  homeText: 'Nhìn, nghe và chơi để bước vào thế giới diệu kỳ.\nMột cuộc phiêu lưu nhỏ dành riêng cho bé yêu của bạn.',
  homeCta: 'Chơi nào! 🚀', homeAges: 'Dành cho các bé tò mò, từ 1–5 tuổi', featLook: '👀 Nhìn', featTap: '👆 Chạm', featCelebrate: '🌟 Chúc mừng',
  homePhotoAlt: 'Chú gấu bông thân thiện sẵn sàng cho chuyến phiêu lưu học tập', photoNote: 'Cuộc phiêu lưu tiếp theo bắt đầu từ đây! ✨', floatPill: '💛 Bước nhỏ. Điều kỳ diệu lớn.',
  hintTitle: 'Không áp lực, chỉ khám phá!', hintText: 'Không cần tài khoản. Không có bước phức tạp. Chỉ một chút học và thật nhiều niềm vui.',
  sayLetsPlay: 'Chơi nào! Con bao nhiêu tuổi?', sayChooseTopic: 'Con chọn một chủ đề nhé!',

  ageTitle: 'Con bao nhiêu tuổi? 🎈', ageSubtitle: 'Chạm vào độ tuổi của con để bắt đầu nhé!', years: 'TUỔI', chooseYears: 'Chọn {age} tuổi',
  ageYoungTitle: 'Những khám phá đầu tiên 🍼', ageYoungText: 'Hình ảnh to, rõ, âm thanh nhẹ nhàng và những điều đơn giản cho các bé nhỏ.',
  ageYoungPills: '🖼️ Hình ảnh to, rõ|🎵 Âm thanh nhẹ nhàng|✨ Câu hỏi dễ',
  ageOldTitle: 'Nhà thám hiểm nhỏ tò mò 🎒', ageOldText: 'Nuôi dưỡng trí tò mò với chữ cái, con số và thế giới đầy màu sắc.',
  ageOldPills: '💡 Tư duy tò mò|🔢 Số và chữ|🌍 Khám phá thế giới',
  ageYoungAlt: 'Chú mèo con đáng yêu trong phòng chơi ấm áp', ageOldAlt: 'Chú gấu bông tò mò đeo ba lô nhỏ',
  ageHintTitle: 'Chỉ một chạm, rồi sang bước Chọn chủ đề! ✨', ageHintText: 'Chọn thẻ phù hợp với con. Cuộc phiêu lưu tiếp theo chỉ cách một chạm.',

  back: 'Quay lại', topicStep: 'Bước 2 trên 4: Chọn chủ đề', topicTitle: 'Chọn một chủ đề! 🎯',
  topicText: 'Hôm nay con muốn học gì nào?\nChạm vào một thẻ và cùng khám phá!', preschoolPill: 'An toàn cho bé •\nVui 100%',
  sayTopicGuide: 'Con chọn một chủ đề nhé! Hôm nay con muốn học gì nào?', listenGuide: 'Nghe hướng dẫn chọn chủ đề',
  fiveQuestions: '5 câu hỏi', surprise: 'Bất ngờ nào!', allTopics: 'Tất cả chủ đề', allTopicsText: 'Những điều bất ngờ từ mọi thế giới nhỏ!',
  saySurprise: 'Tất cả chủ đề! Bất ngờ nào!', hear: 'Nghe {name}', selected: 'Đã chọn', selectedTopic: 'Chủ đề đã chọn:',
  moreWorlds: 'Thêm thế giới nhỏ ↓', fewerWorlds: 'Ít thế giới nhỏ hơn ↑', topicHintTitle: 'Không áp lực, chỉ khám phá!',
  topicHintText: 'Mỗi câu trả lời là một khám phá mới. Cùng xem con học được gì nhé!', ageReminder: 'Dành cho nhà thám hiểm {age} tuổi của bạn',
  letsPlay: 'Chơi nào! 🚀', gettingReady: 'Đang chuẩn bị… ✨', tapToHear: 'Nghe lại', logoTagline: 'CHƠI & HỌC', scoreLabel: 'Câu trả lời đúng', allTopicsTitle: 'Tất Cả Chủ Đề', surpriseHint: 'Surprise me!', favouriteBadge: 'Được các bé yêu thích nhất!', surpriseDesc: 'Vòng quay bất ngờ! Trộn ngẫu nhiên câu đố động vật, màu sắc, trái cây siêu vui mà không cần suy nghĩ!', playSurprise: 'Chơi Ngay!', orPickOne: 'Hoặc chọn một bài bé thích:', wonderTopics: '{n} chủ đề kỳ diệu', loadingQuestions: 'Nimo đang chọn câu hỏi cho con…', loadingSlow: 'Mạng hơi chậm, Nimo vẫn đang cố gắng…',
  topicsLoading: 'Đang tìm những thế giới nhỏ vui vẻ…', errTitle: 'Ôi! Mình thử lại nhé',
  errOffline: 'Các thế giới nhỏ đang hơi ngại. Hãy kiểm tra internet rồi thử lại.',
  errServer: 'Có điều gì đó chưa ổn từ phía chúng mình. Vui lòng thử lại sau ít phút.', tryAgain: 'Thử lại 🔄',
  startNotReady: 'Thế giới nhỏ này chưa sẵn sàng để chơi. Con chọn thế giới khác nhé!', startLost: 'Lượt chơi vừa rồi đã kết thúc sớm. Mình bắt đầu lượt mới nhé!',
  startOffline: 'Chúng mình chưa kết nối được. Hãy kiểm tra internet rồi thử lại.',

  tinyLabel: 'NHÌN, NGHE VÀ KHÁM PHÁ', question: 'Câu {n}/{total}', questionAria: 'Câu {n} trên {total}', seconds: 'giây',
  secondsAria: 'Còn {n} giây', pictureAlt: 'Hãy nhìn bức tranh này', tapAnswer: 'Chạm vào đáp án của con ↓', tapAgain: 'Ôi! Chạm lại nhé 💛',
  fbCorrect: 'Giỏi lắm! 🎉', fbWrong: 'Thử lại nhé! 💛', fbTimeout: 'Hết giờ rồi! ⏰',
  quizHintCorrect: 'Con là ngôi sao nhỏ!', quizHintAnswered: 'Mỗi lần thử đều giúp trí óc nhỏ lớn lên.', quizHintIdle: 'Nhìn kỹ nhé. Con làm được mà!',
  quizHint2Answered: 'Một khám phá nhỏ nữa đang đến…', quizHint2Idle: 'Câu hỏi tiếp theo sẽ tự đến.',

  resultPill: '✨ Một cuộc phiêu lưu nhỏ. Một cái đập tay thật to!', trophy: 'Chiếc cúp vàng', greatJob: 'Giỏi lắm! 🎉', resultText: 'Con đã khám phá, đã thử và học được điều mới!',
  starsLabel: '{n} ngôi sao', accuracy: '🎯 Chính xác', bestStreak: '🔥 Chuỗi đúng dài nhất', currentStreak: '⭐ Chuỗi hiện tại', playAgain: 'Chơi lại! 🚀',
  homeButton: '⌂ Trang chủ', share: '↗ Chia sẻ', replayNote: 'Thêm niềm vui với {topic} • Tuổi {age}', copied: 'Đã sao chép lời chúc! 💛',
  shareText: 'Một khoảnh khắc vui cùng NimoKids! Đúng {score}/{total} câu ở chủ đề {topic}. 🌟', shareTitle: 'NimoKids • Giỏi lắm!',

  footerTitle: 'Phòng chơi số an toàn cho bé', footerText: 'Không quảng cáo, hướng dẫn nhẹ nhàng và thật nhiều nụ cười',
  footerAges: '💛 Từ 1–5 tuổi • Không cần tài khoản', footerMade: 'Làm bằng tình yêu cho đôi tay nhỏ.', footerPlay: 'Chơi', footerParents: 'Dành cho phụ huynh', footerLinkHome: 'Trang chủ', footerLinkAge: 'Chọn độ tuổi', footerLinkTopics: 'Tất cả chủ đề', footerFact1: 'Chơi không cần tài khoản', footerFact2: 'Đăng nhập Google là tùy chọn, dành cho phụ huynh', footerFact3: 'Không quảng cáo, không liên kết ra ngoài game', footerFact4: 'Tiếng Việt, hoặc tiếng Việt kèm từ tiếng Anh', footerBrandText: 'Câu đố bằng hình ngắn cho bé: nhìn, nghe và chạm.',

  authSignIn: 'Đăng nhập', authSignInAria: 'Đăng nhập (tùy chọn)', authChecking: 'Đang đăng nhập…', authMenuAria: 'Tài khoản của {name}',
  authKicker: 'DÀNH CHO PHỤ HUYNH • LUÔN TÙY CHỌN', authKickerCorner: 'GÓC NIMOKIDS CỦA BÉ', authClose: 'Đóng',
  authIntroTitle: 'Lưu lại hành trình của bé! 🌟', authIntroText: 'Đăng nhập để lưu tiến trình, thành tích và lịch sử chơi.',
  authBenefits: '🌟 Những thành tích nhỏ|📖 Kỷ niệm khi chơi|💛 Chơi tiếp từ chỗ đang dở',
  authLoadingTitle: 'Đang đăng nhập…', authLoadingText: 'Chờ một chút nhé. Cuộc phiêu lưu tiếp theo đang đợi bé.',
  authCancelledTitle: 'Không sao, mình chơi tiếp nhé! 💛', authCancelledText: 'Bạn đã hủy đăng nhập. Cuộc phiêu lưu của bé vẫn đang đợi.',
  authErrorTitle: 'Có lỗi xảy ra rồi.', authErrorText: 'Không sao đâu! Hãy thử lại, hoặc cứ chơi tiếp mà không cần đăng nhập.',
  authDisabledTitle: 'Tài khoản này hiện không dùng được', authDisabledText: 'Hãy liên hệ chúng mình nếu bạn nghĩ đây là nhầm lẫn. Bé vẫn chơi được mà không cần đăng nhập.',
  authUnavailableText: 'Hiện chưa đăng nhập được. Bé vẫn chơi bình thường nhé!',
  authContinueGoogle: 'Tiếp tục với Google', authTryAgainGoogle: 'Thử lại với Google', authSkip: 'Tiếp tục mà không đăng nhập',
  authCancelKeep: 'Hủy và chơi tiếp', authReassure: 'Chơi không cần tài khoản. Bây giờ và mãi mãi. 💛',
  authReassureIn: 'Bé luôn chơi được, dù có tài khoản hay không.', authHi: 'Chào {name}! 👋', authFriend: 'bạn nhỏ',
  authProfileTitle: 'Góc chơi của bé', authProfileText: 'Tài khoản và các thiết bị đang đăng nhập.',
  authMyAccount: 'Tài khoản của tôi', authSignOut: 'Đăng xuất', authPlayOpen: 'Ai cũng chơi được, luôn luôn. 💛',
  authBack: 'Quay lại chơi! 🚀', authDevices: 'Thiết bị của bạn', authThisDevice: 'Thiết bị này', authSignOutDevice: 'Đăng xuất',
  authSignOutAll: 'Đăng xuất mọi nơi', authNoDevices: 'Không có thiết bị nào khác.', authDevicesError: 'Chưa tải được danh sách thiết bị. Hãy thử lại sau.',
  authSeen: 'Dùng lần cuối {when}', authToastOut: 'Đã đăng xuất. Mình chơi tiếp nhé!', authToastEnded: 'Bạn đã bị đăng xuất. Bé vẫn chơi được và có thể đăng nhập lại bất cứ lúc nào.',
  authToastAll: 'Đã đăng xuất trên mọi thiết bị.', authSavePromptTitle: 'Giữ lại những khám phá nhỏ', authSavePromptText: 'Muốn lưu tiến trình của bé? Đăng nhập chỉ là tùy chọn.',
  authMaybeLater: 'Để sau', authDismiss: 'Đóng gợi ý đăng nhập', authSigningInPage: 'Đang đăng nhập…',

  langLabel: 'Ngôn ngữ', langVi: 'Học tiếng Việt', langViEn: 'Học tiếng Anh', langViHint: 'Toàn bộ tiếng Việt', langViEnHint: 'Câu hỏi tiếng Việt, đáp án tiếng Anh', recommended: 'Khuyên dùng',
};

export const STRINGS: Record<UiLang, Record<UiKey, string>> = { en, vi };

export function translate(lang: UiLang, key: UiKey, vars?: Record<string, string | number>): string {
  const text = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  return vars ? text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`)) : text;
}
