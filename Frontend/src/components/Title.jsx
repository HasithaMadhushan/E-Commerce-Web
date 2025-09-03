import React from 'react'

const Title = ({ title, subTitle }) => {
  return (
    <div className="mb-6">
      {subTitle && (
        <div className="text-xs tracking-widest text-gray-500 uppercase">{subTitle}</div>
      )}
      <div className="flex items-end gap-3 mt-1">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h2>
        <span className="h-[2px] w-16 bg-gray-900 mb-2 hidden sm:block" />
      </div>
    </div>
  )
}

export default Title

