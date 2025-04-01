import React, { useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

const apiUrl = import.meta.env.VITE_PROXY_API_URL;
const replicateApiToken = import.meta.env.VITE_REPLICATE_API_KEY;

function UploadPage() {
  const [imageFile, setImageFile] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleContinue = () => {
    if (!imageFile) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      localStorage.setItem("uploadedImage", base64);
      navigate("/payment");
    };
    reader.readAsDataURL(imageFile);
  };

  return (
    <div className="p-4 text-center">
      <h1 className="text-xl font-bold mb-4">Upload da sua imagem</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button
        onClick={handleContinue}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Continuar para pagamento
      </button>
    </div>
  );
}

function PaymentPage() {
  const navigate = useNavigate();

  const handleConfirmPayment = () => {
    navigate("/result");
  };

  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-bold mb-4">Pagamento via Pix</h2>
      <img src="/qrcode-pix.png" alt="QR Code Pix" className="mx-auto w-48" />
      <p className="mt-4">
        Chave Pix: <strong>ghibli@pix.com</strong>
      </p>
      <button
        onClick={handleConfirmPayment}
        className="mt-6 px-4 py-2 bg-green-600 text-white rounded"
      >
        Confirmar pagamento
      </button>
    </div>
  );
}

function ResultPage() {
  const [loading, setLoading] = useState(true);
  const [styledImage, setStyledImage] = useState(null);
  const uploadedImage = localStorage.getItem("uploadedImage");

  console.log("🧪 Base64 image enviada:", uploadedImage.slice(0, 100));

  React.useEffect(() => {
    const generateImage = async () => {
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            version:
              "a9758cb889b34690a10fca3d83b2b10fcdb64f0937c7348b843c1302885e5924",
            input: {
              image: uploadedImage,
              prompt: "a portrait in the style of Studio Ghibli",
            },
          }),
        });

        const prediction = await response.json();

        const predictionResult = await waitForPrediction(prediction.id);
        setStyledImage(predictionResult.output);
      } catch (error) {
        console.error("Erro ao gerar imagem:", error);
      } finally {
        setLoading(false);
      }
    };

    generateImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const waitForPrediction = async (id) => {
    while (true) {
      const res = await fetch(
        `https://api.replicate.com/v1/predictions/${id}`,
        {
          headers: { Authorization: `Token ${replicateApiToken}` },
        }
      );
      const data = await res.json();
      if (data.status === "succeeded") return data;
      if (data.status === "failed") throw new Error("Geração falhou");
      await new Promise((r) => setTimeout(r, 2000));
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = styledImage;
    link.download = "imagem-estilo-ghibli.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 text-center">
      {loading ? (
        <p>Gerando imagem no estilo Ghibli...</p>
      ) : styledImage ? (
        <>
          <h2 className="text-xl font-bold mb-4">Sua imagem transformada:</h2>
          <img
            src={styledImage}
            alt="Resultado"
            className="mx-auto max-w-full mb-4"
          />
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-700 text-white rounded"
          >
            Baixar imagem
          </button>
        </>
      ) : (
        <p>Erro ao gerar imagem.</p>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </Router>
  );
}
