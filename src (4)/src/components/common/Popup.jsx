import React from "react";

export const Popup=({text,color})=>{
    return(
        <div className={`fixed  z-100 top-0 bg-white p-4 left-1/2 -translate-x-1/2 ${color}`}>
        <p className="text-white">{text} <i className="fas fa-check-circle"></i></p>
    </div>
    )
}