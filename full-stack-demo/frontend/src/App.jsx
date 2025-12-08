import TaskList from './components/TaskList'

function App() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                        TaskFlow
                    </h1>
                    <p className="text-gray-500 mt-2">Simple, clean, efficient task management.</p>
                </header>
                <TaskList />
            </div>
        </div>
    )
}

export default App
