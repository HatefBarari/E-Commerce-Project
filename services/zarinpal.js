const { default: axios } = require("axios");

const zarinpal = axios.create({
  baseURL: process.env.ZARINPAL_API_BASE_URL,
});

exports.createPayment = async function ({ amountInRial, description, mobile }) {
  try {
    const response = await zarinpal.post("/request.json", {
      merchant_id: process.env.ZARINPAL_MERCHANT_ID,
      callback_url: process.env.ZARINPAL_PAYMENT_CALLBACK_URL,
      amount: amountInRial,
      description,
      metadata: {
        mobile,
      },
    });

    const data = response.data.data;

    return {
      authority: data.authority,
      paymentUrl: process.env.ZARINPAL_PAYMENT_BASE_URL + data.authority,
    };
  } catch (err) {
    console.log(err);

    throw new Error(err);
  }
};

exports.verifyPayment = async function ({ amountInRial, authority }) {
  try {
    const response = await zarinpal.post("/verify.json", {
      merchant_id: process.env.ZARINPAL_MERCHANT_ID,
      amount: amountInRial,
      authority,
    });

    const data = response.data.data;

    return data;
  } catch (err) {
    throw new Error(err);
  }
};
