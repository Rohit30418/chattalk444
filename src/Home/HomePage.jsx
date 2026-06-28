import React from 'react'
import Hero from './Hero'
import FeaturedLanguages from './FeaturedLanguages'
import ActiveRooms from './ActiveRooms'
import HowItWorks from './HowItWorks'
import AiUnlockSection from './AiUnlockSection'
import Testimonials from './Testimonials'
import SupportedBy from './SupportedBy'
const HomePage = () => {
  return (
    <div>        
      <Hero></Hero>
      <FeaturedLanguages></FeaturedLanguages>
      <ActiveRooms></ActiveRooms>
      <HowItWorks></HowItWorks>
      <AiUnlockSection></AiUnlockSection>
      <Testimonials></Testimonials>
      <SupportedBy></SupportedBy>

    </div>
  )
}

export default HomePage