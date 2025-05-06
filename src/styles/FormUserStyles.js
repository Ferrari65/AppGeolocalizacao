import { StyleSheet, Dimensions, Platform } from "react-native";

const { width } = Dimensions.get("window");
const PADDING = 16;

export default StyleSheet.create({
  container: {
    width: "100%",
    padding: PADDING,
  },
  sectionTitle: {
    width: "100%",
    paddingVertical: PADDING,
    paddingHorizontal: PADDING,
    textAlign: "center",
    marginTop: PADDING,
    marginBottom: 8,
    fontSize: 25,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    width: "100%",
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    fontSize: 16,
  },
  button: {
    marginTop: PADDING,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#3498DB",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,

    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
