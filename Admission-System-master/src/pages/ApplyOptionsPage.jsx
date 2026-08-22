import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const ApplyOptionsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center text-[#ef3131] hover:underline mb-6 md:mb-8 font-medium"
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </Link>

          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
              Choose Your Application Method
            </h1>
            <div className="w-24 h-1 bg-[#ef3131] mx-auto mb-4 md:mb-6"></div>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto font-light">
              Select the application method that works best for you. All options
              will guide you through our admission process.
            </p>
          </div>

          <Card className="border-0 shadow-xl bg-gradient-to-r from-[#ef3131] to-red-600 text-white mb-8 md:mb-10">
            <CardContent className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
                <div>
                  <p className="text-sm uppercase tracking-wide text-red-100 mb-2">
                    New Student Feature
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">
                    Admission Tracking Portal
                  </h3>
                  <p className="text-red-100 text-sm md:text-base">
                    View your admission pipeline, exam/interview analytics, and export your
                    personal progress reports.
                  </p>
                </div>
                <Link to="/student-portal">
                  <Button className="w-full md:w-auto bg-slate-900 text-white border-2 border-white hover:bg-slate-800 rounded-full px-6 py-3 font-semibold shadow-2xl">
                    Open Portal
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Reception Coordinator Application */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white h-full flex flex-col">
              <CardHeader className="text-center pb-4 md:pb-6 flex-shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#ef3131]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <svg
                    className="h-8 w-8 md:h-10 md:w-10 text-[#ef3131]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 14l9-5-9-5-9 5 9 5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">
                  I am a Reception Coordinator
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6 flex-grow flex flex-col">
                <p className="text-gray-600 leading-relaxed font-light text-sm md:text-base flex-grow">
                  Access the reception coordinator portal to register student information and
                  manage the admission process for your students.
                </p>

                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center text-left">
                    <svg
                      className="h-4 w-4 md:h-5 md:w-5 text-[#ef3131] mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span className="text-gray-700 text-sm md:text-base">
                      Register student information
                    </span>
                  </div>
                  <div className="flex items-center text-left">
                    <svg
                      className="h-4 w-4 md:h-5 md:w-5 text-[#ef3131] mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="text-gray-700 text-sm md:text-base">
                      Manage admission documents
                    </span>
                  </div>
                  <div className="flex items-center text-left">
                    <svg
                      className="h-4 w-4 md:h-5 md:w-5 text-[#ef3131] mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l9-5-9-5-9 5 9 5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                      />
                    </svg>
                    <span className="text-gray-700 text-sm md:text-base">
                      Track student progress
                    </span>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4 text-xs md:text-sm text-green-800">
                  <p className="font-medium mb-1">Reception Coordinator Access:</p>
                  <p>
                    Login with your credentials to access the student
                    registration system.
                  </p>
                </div>

                <div className="mt-6">
                  <Link to="/reception-coordinator/login">
                    <Button className="w-full bg-[#ef3131] hover:bg-red-600 text-sm md:text-lg py-2 md:py-3 rounded-full font-semibold">
                      Reception Coordinator Login
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Complete Student Info */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white h-full flex flex-col">
              <CardHeader className="text-center pb-4 md:pb-6 flex-shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#ef3131]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <svg
                    className="h-8 w-8 md:h-10 md:w-10 text-[#ef3131]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <CardTitle className="text-xl md:text-2xl font-bold text-gray-900">
                  Complete Your Info
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6 flex-grow flex flex-col">
                <p className="text-gray-600 leading-relaxed font-light text-sm md:text-base flex-grow">
                  Check if your National ID exists in our system and complete
                  your information to proceed with the admission process.
                </p>

                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center text-left">
                    <svg
                      className="h-4 w-4 md:h-5 md:w-5 text-[#ef3131] mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="text-gray-700 text-sm md:text-base">
                      Verify your National ID
                    </span>
                  </div>
                  <div className="flex items-center text-left">
                    <svg
                      className="h-4 w-4 md:h-5 md:w-5 text-[#ef3131] mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="text-gray-700 text-sm md:text-base">
                      Complete your personal information
                    </span>
                  </div>
                  <div className="flex items-center text-left">
                    <svg
                      className="h-4 w-4 md:h-5 md:w-5 text-[#ef3131] mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="text-gray-700 text-sm md:text-base">
                      Proceed to entrance examination
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 text-xs md:text-sm text-blue-800">
                  <p className="font-medium mb-1">Required Information:</p>
                  <p>
                    Date of Birth, Parent's Occupation, Address, Contact Details
                  </p>
                </div>

                <div className="mt-6">
                  <Link to="/check-national-id">
                    <Button className="w-full bg-[#ef3131] hover:bg-red-600 text-sm md:text-lg py-2 md:py-3 rounded-full font-semibold">
                      Check & Complete Info
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 md:mt-12 text-center">
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">
                  Need Help Choosing?
                </h3>
                <p className="text-gray-600 mb-4 md:mb-6 font-light text-sm md:text-base">
                  If you're unsure which option is right for you, or if you have
                  any questions about the admission process, our team is here to
                  help.
                </p>
                <Link to="/contact">
                  <Button
                    variant="outline"
                    className="border-[#ef3131] text-[#ef3131] hover:bg-[#ef3131] hover:text-white bg-transparent"
                  >
                    Contact Admission Team
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ApplyOptionsPage;
