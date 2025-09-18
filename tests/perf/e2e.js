import http from "k6/http"; import { sleep } from "k6";
export default function () {
  const base = __ENV.BASE_URL; if (!base) { sleep(1); return; }
  http.get(`${base}/v1/progress`); sleep(1);
}
