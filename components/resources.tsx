'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface ResourceBox {
  title: string
  pdfPath: string
  bgImage: string
  color: string
  class: string
}

const resources: ResourceBox[] = [
  // 11th Class Resources
  {
    title: "11th Physics NCERT",
    pdfPath: "/resources/11th_physics_NCERT.pdf",
    bgImage: "/images/11_physics.jpg",
    color: "from-blue-500/50 to-blue-600/50",
    class: "11th"
  },
  {
    title: "11th Chemistry NCERT",
    pdfPath: "/resources/11th_chemistry_NCERT.pdf",
    bgImage: "/images/11_chemistry.jpg",
    color: "from-green-500/50 to-green-600/50",
    class: "11th"
  },
  {
    title: "11th Maths NCERT",
    pdfPath: "/resources/11th_maths_NCERT.pdf",
    bgImage: "/images/11_maths.jpg",
    color: "from-purple-500/50 to-purple-600/50",
    class: "11th"
  },
  // 12th Class Resources
  {
    title: "12th Physics NCERT",
    pdfPath: "/resources/12th_physics_NCERT.pdf",
    bgImage: "/images/12_physics.jpg",
    color: "from-blue-600/50 to-blue-700/50",
    class: "12th"
  },
  {
    title: "12th Chemistry NCERT",
    pdfPath: "/resources/12th_chemistry_NCERT.pdf",
    bgImage: "/images/12_chemistry.jpg",
    color: "from-green-600/50 to-green-700/50",
    class: "12th"
  },
  {
    title: "12th Maths NCERT",
    pdfPath: "/resources/12th_maths_NCERT.pdf",
    bgImage: "/images/12_maths.jpg",
    color: "from-purple-600/50 to-purple-700/50",
    class: "12th"
  }
]

const ResourceBox = ({ resource }: { resource: ResourceBox }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className="w-full"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`h-48 cursor-pointer overflow-hidden relative group`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => window.open(resource.pdfPath, '_blank')}
      >
        <div
          className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-500"
          style={{
            backgroundImage: `url(${resource.bgImage})`,
            transform: isHovered ? 'scale(1.1)' : 'scale(1)'
          }}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-br ${resource.color} 
            transition-opacity duration-300 ${isHovered ? 'opacity-90' : 'opacity-75'}`}
        />
        <CardContent className="relative z-10 h-full flex flex-col items-center justify-center p-6">
          <h3 className="text-2xl font-bold text-white text-center mb-2">
            {resource.title}
          </h3>
          <div
            className={`w-full h-1 bg-white transform scale-x-0 transition-transform duration-300
              ${isHovered ? 'scale-x-100' : ''}`}
          />
          <div
            className={`absolute inset-0 ring-2 ring-white/50 opacity-0 transition-opacity duration-300
              ${isHovered ? 'opacity-100' : ''}`}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function ResourcesContent() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">IIT-JEE Resources</h1>
      
      {/* 11th Class Resources */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Class 11th NCERT Books</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {resources
            .filter(resource => resource.class === "11th")
            .map((resource, index) => (
              <ResourceBox key={index} resource={resource} />
            ))}
        </div>
      </div>

      {/* 12th Class Resources */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Class 12th NCERT Books</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {resources
            .filter(resource => resource.class === "12th")
            .map((resource, index) => (
              <ResourceBox key={index} resource={resource} />
            ))}
        </div>
      </div>
    </div>
  )
}
