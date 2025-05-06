import * as Location from "expo-location";
import { useEffect, useState } from "react";

export default function useLocation() {
  const [coords, setCoords] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permissão negada para acessar a localização");
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);
  return { coords, errorMsg };
}
