import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchConTimeout, fetchConReintento } from "./http";

describe("fetchConTimeout", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pasa la respuesta cuando fetch resuelve normal", async () => {
    const fakeRes = { ok: true };
    fetch.mockResolvedValueOnce(fakeRes);
    const res = await fetchConTimeout("https://x.test");
    expect(res).toBe(fakeRes);
  });

  it("pasa un AbortSignal a fetch", async () => {
    fetch.mockResolvedValueOnce({ ok: true });
    await fetchConTimeout("https://x.test", { method: "GET" });
    const [, options] = fetch.mock.calls[0];
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(options.method).toBe("GET");
  });

  it("propaga el error si fetch rechaza", async () => {
    fetch.mockRejectedValueOnce(new Error("network down"));
    await expect(fetchConTimeout("https://x.test")).rejects.toThrow("network down");
  });
});

describe("fetchConReintento", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("no reintenta si la primera petición funciona", async () => {
    fetch.mockResolvedValueOnce({ ok: true });
    await fetchConReintento("https://x.test");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("reintenta UNA vez si la primera petición falla, y retorna la segunda", async () => {
    const fakeRes = { ok: true };
    fetch.mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce(fakeRes);
    const res = await fetchConReintento("https://x.test");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(res).toBe(fakeRes);
  });

  it("si el reintento también falla, propaga ese error", async () => {
    fetch.mockRejectedValueOnce(new Error("timeout 1")).mockRejectedValueOnce(new Error("timeout 2"));
    await expect(fetchConReintento("https://x.test")).rejects.toThrow("timeout 2");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
