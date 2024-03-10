const dotenv = require("dotenv");
dotenv.config();
const OpenAI = require("openai");
const { fetchFileContent } = require("./fileAction");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API });

const attachLabels = async (
  authenticatedGmail,
  email,
  messageId,
  userEmail,
  threadId
) => {
  try {
    let fromMailAddress = null;

    const fromMail = email.from;
    fromMailAddress = fromMail?.split("<")[1]?.split(">")[0]
      ? fromMail?.split("<")[1]?.split(">")[0]
      : fromMail;

    const sentiment = await analyzeEmail(email.snippet);

    let { labelId, draftMail } = getUserPref(
      userEmail,
      sentiment.toLowerCase()
    );

    if (labelId) {
      await authenticatedGmail.users.messages.modify({
        userId: "me",
        id: messageId,
        resource: {
          addLabelIds: [labelId],
        },
      });
    }

    if (fromMailAddress) {
      await addReplyMessage(
        authenticatedGmail,
        threadId,
        fromMailAddress,
        email,
        sentiment,
        userEmail,
        draftMail
      );
    }
    return true;
  } catch (error) {
    console.log("error while attaching labels", error);
    throw error;
  }
};

const analyzeEmail = async (text) => {
  try {
    const positiveSentiment = [
      "interested",
      "yes this is interesting",
      "can we set up a call",
      "call me",
      "can we set up a teams meeting",
      "im free on monday for a meeting",
      "can you send over more information",
      "more info",
      "call me",
      "lets have a meeting",
    ];

    const neutralSentiment = [
      "out of office",
      "ooo",
      "maternity leave",
      "pto",
      "will respond when i'm back",
      "has left the company",
      "no longer with the company",
      "has moved on",
      "is no longer with us",
      "will be back in the office",
    ];

    const negativeSentiment = [
      "unsub",
      "unsubscribe",
      "not interested",
      "fuck off",
      "remove me from your list",
      "no thanks",
      "no thx",
      "this is spam",
      "dont contact me again",
      "remove me from your database",
    ];

    const prompt = `
    Given the provided keywords, assess the sentiment of the given email scenario and provide a JSON output indicating whether the text is positive, negative, or neutral.
    Take into consideration the following sentiment cues:
    Positive Sentiment Keywords: ${positiveSentiment}
    Neutral Sentiment Keywords: ${neutralSentiment}
    Negative Sentiment Keywords: ${negativeSentiment}
  `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const jsonResponse = JSON.parse(response.choices[0].message.content);

    if (!jsonResponse["sentiment"]) {
      console.log("No sentiment found", response.choices[0].message.content);
      return "neutral";
    }

    return jsonResponse["sentiment"];
  } catch (error) {
    console.log("error while analyzing email", error);
    throw error;
  }
};

const getUserPref = (currentUser, sentiment) => {
  try {
    const fileContent = fetchFileContent();
    const parsedFileContent = JSON.parse(fileContent);

    const userDetail = parsedFileContent[currentUser] || {};
    const labels = userDetail?.labels;

    let labelId = null;
    const draftMail = userDetail?.draftMail || false;

    if (sentiment === "positive") {
      labelId = labels["positive"];
    } else if (sentiment === "neutral") {
      labelId = labels["neutral"];
    } else if (sentiment === "negative") {
      labelId = labels["negative"];
    }

    return { labelId, draftMail };
  } catch (error) {
    console.log("error while getting label id", error);
    throw error;
  }
};

const addReplyMessage = async (
  authenticatedGmail,
  threadId,
  fromMail,
  email,
  scenario,
  userEmail,
  draftMail = false
) => {
  try {
    const emailText = await generateReplyText(scenario, email, userEmail);

    const replyContent = `To: ${fromMail}\n${emailText}`;
    const encodedReply = Buffer.from(replyContent).toString("base64");

    if (draftMail) {
      const draft = {
        userId: "me",
        resource: {
          message: {
            raw: encodedReply,
            threadId: threadId,
          },
        },
      };

      const response = await authenticatedGmail.users.drafts.create(draft);

      const draftId = response.data.id;

      return draftId;
    } else {
      const message = {
        userId: "me",
        resource: {
          raw: encodedReply,
          threadId: threadId,
        },
      };

      const response = await authenticatedGmail.users.messages.send(message);

      const replyId = response.data.id;

      return replyId;
    }
  } catch (error) {
    console.log("error while adding reply message", error);
    throw error;
  }
};

const generateReplyText = async (scenario, email, userEmail) => {
  try {
    const emailContext = {
      from: email.from,
      to: email.to,
      subject: email.subject,
      snippet: email.snippet,
    };

    const fileContent = fetchFileContent();

    const parsedFileContent = JSON.parse(fileContent);

    const userDetail = parsedFileContent[userEmail] || {};

    const calendly_link = userDetail?.calendlyLink;

    const name = userDetail?.name;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: [
        {
          role: "system",
          content: `I want you to act as an Email Writer Expert. I will provide you email that user given and you have to Write a professional reply to this email based provided email context. Reply should be based on provided scenario and email body stating with Subject that is in email context, followed by body text.
            \n Exclude company name, position, name and regards etc. \n\n`,
        },
        {
          role: "user",
          content: `scenario:${scenario} email context: ${JSON.stringify(
            emailContext
          )}`,
        },
      ],
    });
    const body = response.choices[0].message.content;

    let finalBody = body;

    if (finalBody.includes("[Your Name]")) {
      finalBody = finalBody.replace(
        "[Your Name]",
        name ? name : userEmail.split("@")[0]
      );
    } else {
      finalBody = `${finalBody} \n \nThanks, \n${
        name ? name : userEmail.split("@")[0]
      }`;
    }

    if (scenario === "positive" && calendly_link) {
      finalBody = `${finalBody} \n \nYou can schedule a meeting with us using this link: ${calendly_link}`;
    }

    return finalBody;
  } catch (error) {
    console.log("error while generating reply text", error);
    throw error;
  }
};

module.exports = {
  attachLabels,
  generateReplyText,
};
