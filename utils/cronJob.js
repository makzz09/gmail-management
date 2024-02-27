const cron = require("cron");
const { fetchFileContent, saveFileContent } = require("./fileAction");
const { getAuthenticatedGmail } = require("./gmail");

const startWatches = async () => {
  try {
    const topicName = process.env.PUBSUB_TOPIC;

    const fileContent = fetchFileContent();

    if (!fileContent) return;

    const parsedFileContent = JSON.parse(fileContent);
    let newFileContent = parsedFileContent;

    const users = Object.keys(parsedFileContent);

    await Promise.all(
      users.map(async (user) => {
        const userDetail = parsedFileContent[user];

        if (userDetail.isWatching) {
          const authenticatedGmail = await getAuthenticatedGmail(user);

          if (!authenticatedGmail) return;

          await authenticatedGmail.users.stop({
            userId: "me",
          });

          const response = await authenticatedGmail.users.watch({
            userId: "me",
            resource: {
              topicName,
            },
          });

          newFileContent = {
            ...newFileContent,
            [user]: {
              ...userDetail,
              historyId: response.data.historyId,
            },
          };
        }
      })
    );

    saveFileContent(JSON.stringify(newFileContent));
    return;
  } catch (error) {
    console.log("error while starting watches", error);
  }
};

const weekly = () => {
  const job = new cron.CronJob(
    "0 0 * * *", // every day at 12:00 AM
    async () => {
      // Check if it's the 5th day
      const dayOfMonth = new Date().getDate();
      if (dayOfMonth % 5 === 0) {
        await startWatches();
      }
    },
    null,
    true,
    "America/Los_Angeles"
  );
  job.start();
};

const cronJob = () => {
  weekly();
};
module.exports = cronJob;
