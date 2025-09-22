'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, Camera, Clock, RefreshCw } from 'lucide-react'
import Image from 'next/image'

interface Device {
  device_id: string
  status: string
  last_seen: string
}

interface ImageData {
  filename: string
  upload_time: string
  url: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Home() {
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [images, setImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDevices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/devices`)
      const data = await response.json()
      const deviceList = Object.entries(data.devices).map(([device_id, status]: [string, any]) => ({
        device_id,
        status: status.status,
        last_seen: status.last_seen
      }))
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
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedDevice) {
      fetchImages(selectedDevice)
    }
  }, [selectedDevice])

  const getStatusIcon = (status: string) => {
    return status === 'online' ? (
      <Wifi className="w-5 h-5 text-green-500" />
    ) : (
      <WifiOff className="w-5 h-5 text-red-500" />
    )
  }

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'text-green-600' : 'text-red-600'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Camera className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Raspberry Pi Monitor</h1>
            </div>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Device Status Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Status</h2>
              
              {devices.length === 0 ? (
                <div className="text-center py-8">
                  <WifiOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No devices connected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {devices.map((device) => (
                    <div
                      key={device.device_id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedDevice === device.device_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedDevice(device.device_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(device.status)}
                          <div>
                            <p className="font-medium text-gray-900">
                              {device.device_id}
                            </p>
                            <p className={`text-sm ${getStatusColor(device.status)}`}>
                              {device.status === 'online' ? 'Connected' : 'Disconnected'}
                            </p>
                          </div>
                        </div>
                      </div>
                      {device.last_seen && (
                        <p className="text-xs text-gray-500 mt-2">
                          Last seen: {formatDate(device.last_seen)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Images Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Images {selectedDevice && `(${images.length})`}
                </h2>
                {selectedDevice && (
                  <span className="text-sm text-gray-500">
                    Device: {selectedDevice}
                  </span>
                )}
              </div>

              {!selectedDevice ? (
                <div className="text-center py-12">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a device to view images</p>
                </div>
              ) : images.length === 0 ? (
                <div className="text-center py-12">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No images available for this device</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={`${API_BASE_URL}${image.url}`}
                          alt={image.filename}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs truncate">{image.filename}</p>
                        <p className="text-xs text-gray-300">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatDate(image.upload_time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
