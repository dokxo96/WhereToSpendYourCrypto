import React, { useState } from "react";
import { GoogleMap, InfoWindow, LoadScript, Marker } from "@react-google-maps/api";

const MapComponent = () => {
  const initialMarkers = [
    {
      position: {
        lat: 20.67824,
        lng: -103.34208,
      },
      label: { color: "red", text: "P1" },
      draggable: true,
    },
  ];

  const [activeInfoWindow, setActiveInfoWindow] = useState("");
  const [markers, setMarkers] = useState(initialMarkers);

  const containerStyle = {
    width: "50%",
    height: "600px",
  };

  const center = {
    lat: 20.679307,
    lng: -103.340628,
  };

  const mapClicked = event => {
    console.log(event.latLng.lat(), event.latLng.lng());
  };

  const markerClicked = (marker, index) => {
    setActiveInfoWindow(index);
    console.log(marker, index);
  };

  const markerDragEnd = (event, index) => {
    console.log(event.latLng.lat());
    console.log(event.latLng.lng());
  };

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_MAP_APIKEY}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15} onClick={mapClicked}>
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={marker.position}
            label={marker.label}
            draggable={marker.draggable}
            onDragEnd={event => markerDragEnd(event, index)}
            onClick={event => markerClicked(marker, index)}
          >
            {activeInfoWindow === index && (
              <InfoWindow position={marker.position}>
                <b>
                  {marker.position.lat}, {marker.position.lng}
                </b>
              </InfoWindow>
            )}
          </Marker>
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default MapComponent;
