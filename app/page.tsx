'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Camera, Clock, RefreshCw, Monitor, Activity, AlertCircle, X, Download } from 'lucide-react'
import Image from 'next/image'

interface Device {
  device_id: string
  status: string
  last_seen: string
  image_count?: number
}

interface ImageData {
  filename: string
  upload_time: string
  url: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://c4kgwso4ggcgk44080kc4ooo.157.90.23.234.sslip.io'

export default function Home() {
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [images, setImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)

  const fetchDevices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices`)
      const data = await response.json()
      const deviceList = await Promise.all(
        Object.entries(data.devices).map(async ([device_id, status]: [string, any]) => {
          // Fetch image count for each device
          let imageCount = 0
          try {
            const imageResponse = await fetch(`${API_BASE_URL}/api/images/${device_id}`)
            const imageData = await imageResponse.json()
            imageCount = imageData.images?.length || 0
          } catch (error) {
            console.error(`Error fetching images for ${device_id}:`, error)
          }
          
          return {
            device_id,
            status: status.status,
            last_seen: status.last_seen,
            image_count: imageCount
          }
        })
      )
      setDevices(deviceList)
      
      // Auto-select first device if none selected
      if (!selectedDevice && deviceList.length > 0) {
        setSelectedDevice(deviceList[0].device_id)
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
    }
  }

  const fetchImages = async (deviceId: string) => {
    if (!deviceId) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/images/${deviceId}`)
      const data = await response.json()
      setImages(data.images || [])
    } catch (error) {
      console.error('Error fetching images:', error)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchDevices()
    if (selectedDevice) {
      await fetchImages(selectedDevice)
    }
    setRefreshing(false)
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchDevices()
      setLoading(false)
    }
    
    loadData()
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(refreshData, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedDevice) {
      fetchImages(selectedDevice)
    }
  }, [selectedDevice])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedImage) {
        closeModal()
      }
    }

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedImage])

  const getStatusIcon = (status: string) => {
    if (status === 'online') {
      return <Wifi className="w-5 h-5 text-green-500" />
    } else if (status === 'disconnected') {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />
    } else {
      return <WifiOff className="w-5 h-5 text-red-500" />
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'online') {
      return 'text-green-600'
    } else if (status === 'disconnected') {
      return 'text-yellow-600'
    } else {
      return 'text-red-600'
    }
  }

  const getStatusText = (status: string) => {
    if (status === 'online') {
      return 'Online'
    } else if (status === 'disconnected') {
      return 'Disconnected'
    } else {
      return 'Offline'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const handleImageClick = (image: ImageData) => {
    setSelectedImage(image)
  }

  const closeModal = () => {
    setSelectedImage(null)
  }

  const downloadImage = (image: ImageData) => {
    const link = document.createElement('a')
    link.href = `${API_BASE_URL}${image.url}`
    link.download = image.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Monitor className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Prevex Data Room</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Devices</p>
                <p className="text-2xl font-bold text-gray-900">{devices.length}</p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Auto-refreshing every 10s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {devices.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <WifiOff className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Devices Connected</h3>
            <p className="text-gray-500 mb-6">Start your Raspberry Pi devices to see them appear here</p>
            <div className="text-sm text-gray-500">
              Auto-refreshing every 10 seconds
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Device Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((device) => (
                <div
                  key={device.device_id}
                  className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-xl ${
                    selectedDevice === device.device_id
                      ? 'border-blue-500 shadow-blue-100'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDevice(device.device_id)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          device.status === 'online' ? 'bg-green-100' : 
                          device.status === 'disconnected' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          {getStatusIcon(device.status)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {device.device_id}
                          </h3>
                          <p className={`text-sm font-medium ${getStatusColor(device.status)}`}>
                            {getStatusText(device.status)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-gray-500">
                          <Camera className="w-4 h-4" />
                          <span className="text-sm">{device.image_count || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    {device.last_seen && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>Last seen: {formatDate(device.last_seen)}</span>
                      </div>
                    )}
                    
                    {selectedDevice === device.device_id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2 text-blue-600">
                          <Activity className="w-4 h-4" />
                          <span className="text-sm font-medium">Selected</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Images Section */}
            {selectedDevice && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Camera className="w-6 h-6 text-blue-600" />
                      <h2 className="text-xl font-semibold text-gray-900">
                        Recent Images
                      </h2>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {images.length} images
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Device: <span className="font-medium">{selectedDevice}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {images.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Images Available</h3>
                      <p className="text-gray-500">This device hasn't captured any images yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {images.map((image, index) => (
                        <div 
                          key={index} 
                          className="relative group cursor-pointer"
                          onClick={() => handleImageClick(image)}
                        >
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                            <Image
                              src={`${API_BASE_URL}${image.url}`}
                              alt={image.filename}
                              width={300}
                              height={300}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-end">
                            <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity w-full">
                              <p className="text-xs font-medium truncate mb-1">{image.filename}</p>
                              <p className="text-xs text-gray-300 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDate(image.upload_time)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedImage.filename}</h3>
                <p className="text-sm text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDate(selectedImage.upload_time)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadImage(selectedImage)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download image"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              <div className="flex justify-center">
                <Image
                  src={`${API_BASE_URL}${selectedImage.url}`}
                  alt={selectedImage.filename}
                  width={800}
                  height={600}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
