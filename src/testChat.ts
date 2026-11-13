import "dotenv/config";
import express from "express";
import { testChatRouter } from "./testChatRouter";

// Servidor local standalone para probar el agente sin Meta (ver testChatRouter.ts).

const PORT = Number(process.env.TEST_CHAT_PORT ?? 3200);
const app = express();
app.use(express.json());
app.use("/", testChatRouter);

app.listen(PORT, () => {
  console.log(`Chat de prueba en http://localhost:${PORT}`);
});
