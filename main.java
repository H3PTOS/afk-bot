package bot;

public class Main {
    public static void main(String[] args) {
        String server = "your-server.aternos.me";
        int port = 25565;

        new Thread(() -> new AFKBot("gold-1", server, port).start()).start();
        new Thread(() -> new AFKBot("gold-2", server, port).start()).start();
        new Thread(() -> new AFKBot("gold-3", server, port).start()).start();
    }
}
