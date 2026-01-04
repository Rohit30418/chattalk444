import React from 'react'
import Header from './components/AppBody/Header'
import Footer from './components/common/Footer'
import { Outlet } from 'react-router'
const Layout = () => {
  return (
    <>
    <Header></Header>
     <Outlet></Outlet>
    <Footer></Footer>
    </>
  
  )
}

export default Layout