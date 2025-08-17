package bot;

import java.util.Random;

public class RandomUtil {
    private static final String[] messages = {
            "هاي يا شباب!",
            "أنا بوت 🤖",
            "كيف الحال؟",
            "😂😂😂",
            "AFK بس لذيذ 😎",
            "أنا موجود! ما تطردوني!",
            "سيرفر جامد 🔥",
            "مين اون؟"
    };

    public static String getRandomMessage() {
        Random rand = new Random();
        return messages[rand.nextInt(messages.length)];
    }
}
