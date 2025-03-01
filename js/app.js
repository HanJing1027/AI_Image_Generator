import { config } from "./config.js";

const generatorForm = document.querySelector(".generator-form");
const promptInput = document.querySelector(".prompt-input");
const imgQuantity = document.querySelector(".img-quantity");
const imageGallery = document.querySelector(".image-gallery");

const handleFormSubmit = (e) => {
  e.preventDefault();

  const userPrompt = promptInput.value.trim();
  const userImgQuantity = imgQuantity.value;

  if (!userPrompt) return;

  const imgCardMarkup = Array.from(
    { length: userImgQuantity },
    () =>
      `
      <div class="img-card loader">
        <img src="images/loader.svg" alt="image" />
        <a href="#" class="download-btn download">
          <i class="bx bx-download"></i>
        </a>
      </div>
    `
  ).join("");

  imageGallery.innerHTML += imgCardMarkup;

  translateAndGenerateAiImgs(userPrompt, userImgQuantity);

  promptInput.value = "";
};

const translateAndGenerateAiImgs = async (userPrompt, userQuantity) => {
  try {
    const translatedPrompt = await translateText(userPrompt, "zh-TW", "en");
    generateAiImgs(translatedPrompt, userQuantity);
  } catch (err) {
    console.error(err);
  }
};

const translateText = async (sourceText, sourceLang, targetLang) => {
  if (!sourceText) return;

  const MY_MEMORY_API_URL = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    sourceText
  )}&langpair=${sourceLang}|${targetLang}`;
  try {
    const response = await fetch(MY_MEMORY_API_URL);
    const data = await response.json();

    return data.responseData.translatedText;
  } catch (err) {
    console.error(err);
  }
};

const generateAiImgs = async (userPrompt, userQuantity) => {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "dall-e-2",
      prompt: userPrompt,
      n: parseInt(userQuantity),
      size: "512x512",
      response_format: "b64_json",
    }),
  };

  try {
    const response = await fetch(config.OPENAI_API_URL, options);
    const data = await response.json();
    console.log(data);

    updateImgCard(data.data);
  } catch (err) {
    console.error(err);
  }
};

const updateImgCard = (imgDataArr) => {
  imgDataArr.forEach((imgObj, index) => {
    const imgCard = imageGallery.querySelectorAll(".loader")[index];
    const imgElement = imgCard.querySelector("img");

    const aiGeneratedImg = `data:image/jpeg;base64,${imgObj.b64_json}`;
    imgElement.src = aiGeneratedImg;

    // 設置下載連結
    const downloadBtn = imgCard.querySelector(".download-btn");
    downloadBtn.href = aiGeneratedImg;
    downloadBtn.setAttribute("download", `ai-image-${Date.now()}-${index}.jpg`);

    imgElement.onload = () => {
      imgCard.classList.remove("loader");
    };
  });
};

generatorForm.addEventListener("submit", handleFormSubmit);
