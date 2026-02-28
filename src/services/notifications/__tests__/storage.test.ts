import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getPreferences,
  savePreferences,
  getDefaultPreferences,
} from "../storage";
import { STORAGE_KEY } from "../types";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe("Notification Storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns default preferences when none stored", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const prefs = await getPreferences();

    expect(prefs).toEqual(getDefaultPreferences());
  });

  it("returns stored preferences", async () => {
    const stored = JSON.stringify({
      pushEnabled: true,
      categories: { chat: false, marketing: true },
    });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(stored);

    const prefs = await getPreferences();

    expect(prefs.categories.chat).toBe(false);
    expect(prefs.categories.marketing).toBe(true);
  });

  it("saves preferences correctly", async () => {
    const prefs = getDefaultPreferences();
    prefs.pushEnabled = false;

    await savePreferences(prefs);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify(prefs)
    );
  });
});
