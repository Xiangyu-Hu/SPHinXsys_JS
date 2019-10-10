/**
 * @file 	diffusion.cpp
 * @brief 	This is the first test to validate our anisotropic diffusion solver.
 * @author 	Chi Zhang and Xiangyu Hu
 * @version 0.2.1
 * 			From here, I will denote version a beta, e.g. 0.2.1, other than 0.1 as
 * 			we will introduce cardiac electrophysiology and cardaic mechanics herein.
 * 			Chi Zhang
 */
/** SPHinXsys Library. */
#include "sphinxsys.h"
/** Namespace cite here. */
using namespace SPH;
/** Geometry parameter. */
Real L = 2.0; 	
Real H = 0.4;
/** Particle spacing and boudary dummy particles. */
Real particle_spacing_ref = H / 40.0;
Real BW = 0.0;
/** Material properties. */
Real rho_0 = 1.0; 	
Real a_0[4] = {1.0, 0.0, 0.0, 0.0};
Real b_0[4] = {1.0, 0.0, 0.0, 0.0};
Vec2d d_0(1.0e-4, 0.0);
/**
* @brief create a water block shape
*/
std::vector<Point> CreatShape()
{
	//geometry
	std::vector<Point> shape;
	shape.push_back(Point(0.0, 0.0));
	shape.push_back(Point(0.0,  H));
	shape.push_back(Point( L,  H));
	shape.push_back(Point( L, 0.0));
	shape.push_back(Point(0.0, 0.0));

	return shape;
}
/** Define geometry and initial conditions of SPH bodies. */
class DiffusionBody : public SolidBody
{
public:
	DiffusionBody(SPHSystem &system, string body_name, int refinement_level, ParticlesGeneratorOps op)
		: SolidBody(system, body_name, refinement_level, op)
	{
		std::vector<Point> body_shape = CreatShape();
		body_region_.add_geometry(new Geometry(body_shape), RegionBooleanOps::add);
		body_region_.done_modeling();
	}
};

/** The main program. */
int main()
{
	/** Build up context -- a SPHSystem. */
	SPHSystem system(Vec2d(- BW, - BW), Vec2d(L + BW, H + BW), particle_spacing_ref);
	GlobalStaticVariables::physical_time_ = 0.0;
	/** Configuration of materials, crate particle container and diffusion body. */
	DiffusionBody *diffusion_body  =  new DiffusionBody(system, "DiffusionBody", 0, ParticlesGeneratorOps::lattice);
	MuscleParticles 			particles(diffusion_body);
	Muscle 						material("Muscle", diffusion_body, a_0, b_0,d_0, rho_0, 1.0);
	/** Set body contact map. */
	SPHBodyTopology body_topology = { { diffusion_body, {  } }};
	system.SetBodyTopology(&body_topology);
	/**
	 * @brief 	Simulation set up.
	 */
	system.SetupSPHSimulation();
	/**
	 * The main dynamics algorithm is defined start here.
	 */
	/** Corrected strong configuration for diffusion body. */	
	electro_physiology::ElectroPhysiologyInitialCondition 	initialization(diffusion_body);
	/** Corrected strong configuration for diffusion body. */	
	electro_physiology::CorrectConfiguration 				correct_configuration(diffusion_body);
	/** Time step size caclutation. */
	electro_physiology::getDiffusionTimeStepSize 			get_time_step_size(diffusion_body);
	/** Diffusion process for diffusion body. */
	electro_physiology::DiffusionRelaxation 				diffusion_relaxation(diffusion_body);
	/**
	 * @brief simple input and outputs.
	 */
	In_Output 							in_output(system);
	WriteBodyStatesToPlt 				write_states(in_output, system.real_bodies_);
	/** Pre-simultion*/
	initialization.parallel_exec();
	correct_configuration.parallel_exec();
	/** Output global basic parameters. */
	write_states.WriteToFile(GlobalStaticVariables::physical_time_);

	int ite 		= 0;
	Real T0 		= 1.0;
	Real End_Time 	= T0;
	Real D_Time 	= 0.1 * End_Time;
	Real Dt 		= 0.001 * D_Time;
	Real dt		 	= 0.0;
	/** Statistics for computing time. */
	tick_count t1 = tick_count::now();
	tick_count::interval_t interval;
	/** Main loop starts here. */ 
	while (GlobalStaticVariables::physical_time_ < End_Time)
	{
		Real integeral_time = 0.0;
		while (integeral_time < D_Time) 
		{
			Real relaxation_time = 0.0;
			while (relaxation_time < Dt) 
			{
				if (ite % 100 == 0) 
				{
					cout << "N=" << ite << " Time: "
						<< GlobalStaticVariables::physical_time_ << "	dt: "
						<< dt << "\n";
				}
				diffusion_relaxation.parallel_exec(dt);

				ite++;
				dt = get_time_step_size.parallel_exec();
				relaxation_time += dt;
				integeral_time += dt;
				GlobalStaticVariables::physical_time_ += dt;
			}
		}

		tick_count t2 = tick_count::now();
		write_states.WriteToFile(GlobalStaticVariables::physical_time_);
		tick_count t3 = tick_count::now();
		interval += t3 - t2;
	}
	tick_count t4 = tick_count::now();

	tick_count::interval_t tt;
	tt = t4 - t1 - interval;
	cout << "Total wall time for computation: " << tt.seconds() << " seconds." << endl;

	return 0;
}
