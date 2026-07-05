import React from 'react'
import Hero from './Hero'
import FeaturedLanguages from './FeaturedLanguages'
import ActiveRooms from './ActiveRooms'
import HowItWorks from './HowItWorks'
import AiUnlockSection from './AiUnlockSection'
const HomePage = () => {
  return (
    <div>        
      <Hero></Hero>
      <FeaturedLanguages></FeaturedLanguages>
      <ActiveRooms></ActiveRooms>
      <HowItWorks></HowItWorks>
      <AiUnlockSection></AiUnlockSection>

    </div>
  )
}

export default HomePage