// MainStyles.js
import { StyleSheet, Platform, Dimensions } from "react-native";
const { width } = Dimensions.get("window");

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    flex: 1,
  },
  openButton: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 30, // positioned above bottom safe area on iOS
    alignSelf: "center",
    backgroundColor: "#007AFF",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    // Optional: add shadow for iOS, elevation for Android for a floating effect
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  openButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // semi-transparent background
    justifyContent: "flex-end",
  },
  keyboardAvoiding: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    width: "100%",
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: "#CCC",
    borderRadius: 2.5,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
