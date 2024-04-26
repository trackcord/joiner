import Captcha from "2captcha";
import Discord from "discord.js-selfbot-v13";
import Bun from "bun";

const solver = new Captcha.Solver(process.env.CAPTCHA_API_KEY!);

async function getInvites() {
  return (await Bun.file("data/invites.txt").text())
    .split("\n")
    .filter(Boolean);
}

const client = new Discord.Client({
  captchaSolver: function (
    captcha: { captcha_sitekey: string; captcha_rqdata?: string },
    UA: string,
  ) {
    return solver
      .hcaptcha(captcha.captcha_sitekey, "https://discord.com/channels/@me", {
        invisible: 1,
        userAgent: UA,
        data: captcha.captcha_rqdata,
      })
      .then((res) => res.data);
  },
  http: {
    agent: proxy,
  },
  captchaRetryLimit: 3,
});

client.on("ready", async () => {
  console.log(`Logged in as ${client.user?.username} (${client.user?.id})`);
  const invites = await getInvites();
  console.log(
    `Loaded ${invites.length} invite${invites.length === 1 ? "" : "s"}, accepting... (this may take a while)`,
  );
  for (const invite of invites) {
    try {
      const start = Date.now();
      await client.acceptInvite(invite);
      console.log(`Accepted invite ${invite} in ${Date.now() - start}ms`);
    } catch (error) {
      console.error(`Failed to accept invite ${invite}: ${error}`);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
