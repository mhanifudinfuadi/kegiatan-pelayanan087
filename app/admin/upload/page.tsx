"use client"

import { useState, useEffect } from "react"
import { getCurrentUser, supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function AdminUpload() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [message, setMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { user } = await getCurrentUser()
    if (!user) {
      router.push("/admin/login")
    } else {
      setUser(user)
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
    setMessage("")
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setMessage("Please select files to upload")
      return
    }

    setUploading(true)
    setUploadProgress(0)
    
    const uploadedUrls: string[] = []
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `ke${Date.now()}-${i}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('kegiatan-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        setMessage(`Error uploading ${file.name}: ${error.message}`)
        setUploading(false)
        return
      }
      
      const { data: publicUrl } = supabase.storage
        .from('kegiatan-images')
        .getPublicUrl(data.path)
      
      uploadedUrls.push(publicUrl.publicUrl)
      setUploadProgress(((i + 1) / selectedFiles.length) * 100)
    }
    
    setMessage(`Successfully uploaded ${selectedFiles.length} file(s)`)
    setSelectedFiles([])
    setUploading(false)
  }

  const handleLogout = async () => {
    const { signOut } = await import("@/lib/supabase")
    await signOut()
    router.push("/admin/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Admin Upload
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            Logout
          </button>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6 shadow-xl">
          <p className="text-gray-400 mb-4">
            Logged in as: <span className="text-white">{user?.email}</span>
          </p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Images to Upload
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {selectedFiles.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">
                  Selected files ({selectedFiles.length}):
                </p>
                <ul className="space-y-1">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="text-sm text-gray-300">
                      • {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {uploading && (
              <div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Uploading... {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
            
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.includes('Error') 
                  ? 'bg-red-900/50 border border-red-700 text-red-300'
                  : 'bg-green-900/50 border border-green-700 text-green-300'
              }`}>
                {message}
              </div>
            )}
            
            <button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Upload Images"}
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <a href="/" className="text-gray-400 hover:text-white text-sm transition">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}