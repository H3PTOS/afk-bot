package bot;

import com.github.steveice10.mc.protocol.MinecraftProtocol;
import com.github.steveice10.packetlib.Client;
import com.github.steveice10.packetlib.Session;
import com.github.steveice10.packetlib.event.session.*;
import com.github.steveice10.packetlib.tcp.TcpClientSession;
import com.github.steveice10.mc.protocol.packet.ingame.client.ClientChatPacket;

import java.util.Timer;
import java.util.TimerTask;

public class AFKBot {
    private final String username;
    private final String server;
    private final int port;
    private Session session;

    public AFKBot(String username, String server, int port) {
        this.username = username;
        this.server = server;
        this.port = port;
    }

    public void start() {
        try {
            connect();
        } catch (Exception e) {
            System.out.println(username + " failed to connect: " + e.getMessage());
        }
    }

    private void connect() {
        MinecraftProtocol protocol = new MinecraftProtocol(username);
        Client client = new Client(server, port, protocol, null);
        session = client.getSession();

        session.addListener(new SessionAdapter() {
            @Override
            public void connected(SessionConnectedEvent event) {
                System.out.println(username + " connected.");
                startMessaging();
            }

            @Override
            public void disconnected(SessionDisconnectedEvent event) {
                System.out.println(username + " disconnected: " + event.getReason());
                tryReconnect();
            }
        });

        session.connect();
    }

    private void tryReconnect() {
        try {
            Thread.sleep(10000);
            connect();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    private void startMessaging() {
        Timer timer = new Timer();
        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                if (session.isConnected()) {
                    String message = RandomUtil.getRandomMessage();
                    session.send(new ClientChatPacket(message));
                    System.out.println(username + " sent: " + message);
                }
            }
        }, 0, 30000); // كل 30 ثانية
    }
}
